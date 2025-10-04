import { insertOrder } from './util/mysql';
import { Bn } from './client/Bn';
import { ChainService } from './chain/ChainService';
import { logger } from './util/logger';

// Custom Error for trade execution
class TradeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TradeError';
  }
}

// Define a clear interface for the chain configuration
export interface ChainConfig {
  tokenSymbol: string;
  category: 'linear' | 'spot';
  side: 'Sell' | 'Buy';
  tokenAmount: number;
  tokenMinAmount: number;
  inputAddress: string;
  outputAddress: string;
  path: string;
  id: number;
  slippage: string;
}

export class TradeManager {
  constructor(
    private bn: Bn,
    private chainService: ChainService,
    private maxSellAmount: number,
    private maxTradeFee: number,
    private balanceSafetyFactor: number
  ) {}

  private isConfigValid(chain: ChainConfig): boolean {
    if (!chain.path.toUpperCase().includes(chain.tokenSymbol.toUpperCase())) {
      logger.warn(`Token ${chain.tokenSymbol} not in path ${chain.path}`);
      return false;
    }
    return true;
  }

  private async fetchData(chain: ChainConfig) {
    return Promise.all([
      this.bn.BnPrice(chain.tokenSymbol, chain.category),
      this.chainService.updateBalanceCache(chain.inputAddress),
    ]);
  }

  private isPriceImpactAcceptable(
    priceData: any,
    tokenAmount: number
  ): boolean {
    const tokenSellAmount =
      Number(priceData.data[0].routerResult.fromToken.tokenUnitPrice) *
      tokenAmount;

    if (tokenSellAmount > this.maxSellAmount) {
      logger.warn(
        `Token sell amount ${tokenSellAmount} exceeds max ${this.maxSellAmount}`
      );
      return false;
    }

    const tradeFee = Number(priceData.data[0].routerResult.tradeFee);
    if (tradeFee > this.maxTradeFee) {
      logger.warn(`Trade fee ${tradeFee} exceeds max ${this.maxTradeFee}`);
      return false;
    }

    logger.info(
      `Token sell amount: ${tokenSellAmount}, Trade fee: ${tradeFee}`
    );
    return true;
  }

  private calculateSpread(
    chain: ChainConfig,
    priceData: any,
    bybitPrice: any
  ): number {
    const toTokenAmount =
      Number(priceData.data[0].routerResult.toTokenAmount) /
      Math.pow(10, Number(priceData.data[0].routerResult.toToken.decimal));

    if (chain.side === 'Sell') {
      return toTokenAmount / chain.tokenAmount;
    } else {
      // Buy
      // u / 买 = 交易所获得数量
      return toTokenAmount / Number(bybitPrice.asks[0][0]) / chain.tokenAmount;
    }
  }

  private async executeTrade(
    chain: ChainConfig,
    priceData: any
  ): Promise<void> {
    const okTx = priceData.data[0].tx;
    const tx = await this.chainService.sendTransaction(okTx);
    if (!tx) {
      throw new TradeError('Failed to send transaction');
    }

    const receipt = await this.chainService.waitForTransaction(tx);
    if (!receipt || receipt.status !== 1) {
      throw new TradeError('Transaction failed on-chain');
    }
    // logger.info('Transaction successful:', { receipt });

    const order = await this.bn.createBybitOrder(
      chain.tokenSymbol,
      chain.category,
      chain.side,
      chain.tokenAmount.toString()
    );
    // logger.info('Order created successfully:', { order });

    // try {
    //   await insertOrder(
    //     receipt.hash,
    //     "bsc",
    //     "bn",
    //     order.result.orderId,
    //     "arbitrage",
    //     chain.category === "spot"
    //   );
    // } catch (error) {
    //   logger.error({ err: error }, "Failed to insert order into database");
    // }
  }

  public async process(chain: ChainConfig): Promise<void> {
    try {
      if (!this.isConfigValid(chain)) return;

      const [BnPrice] = await this.fetchData(chain);
      if (!BnPrice) {
        throw new TradeError('Could not fetch BnPrice price');
      }
      // console.log(BnPrice);
      let tokenInputAmount = chain.tokenAmount;
      if (chain.side === 'Sell') {
        tokenInputAmount = BnPrice.bids[0][0] * chain.tokenAmount;
      }

      console.log(tokenInputAmount);

      const priceData = await this.chainService.getPriceData(
        chain,
        tokenInputAmount
      );
      if (!priceData) {
        throw new TradeError('Could not fetch on-chain price');
      }

      if (!this.isPriceImpactAcceptable(priceData, tokenInputAmount)) {
        return;
      }

      const spread = this.calculateSpread(chain, priceData, BnPrice);
      const isProfitable = spread >= chain.tokenMinAmount;

      logger.info(
        `${chain.tokenSymbol} ${chain.category} ${chain.side} - Spread: ${spread}, Profitable: ${isProfitable}`
      );

      if (isProfitable) {
        await this.chainService.checkBalance(chain, tokenInputAmount);
        await this.executeTrade(chain, priceData);
      }
    } catch (error) {
      logger.error(
        { err: error },
        `Error processing trade for ${chain.tokenSymbol}`
      );
    }
  }
}
