import { ethers } from 'ethers';
import { config } from '../config';
import { okxClient } from '../client/Okxclient';
import { ChainConfig } from '../business';
import { logger } from '../util/logger';
import { sleep } from '../util/utils';

export class ChainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private cache: Map<string, any> = new Map();
  private balance: Map<string, bigint> = new Map();

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.evm.rpcUrl);
    this.wallet = new ethers.Wallet(config.evm.privateKey, this.provider);
  }

  async getCacheBalance(tokenAddress: string): Promise<bigint> {
    const balance = this.balance.get(tokenAddress.toLowerCase());
    if (!balance) {
      throw new Error(`Balance not found for ${tokenAddress}`);
    }
    return balance;
  }

  async updateBalanceCache(inputAddress: string): Promise<bigint> {
    logger.info('Updating balance cache...');
    // Get wallet address
    const walletAddress = this.wallet.address;
    logger.info(`Wallet address: ${walletAddress}`);

    // Update balances for all tokens
    const balance = await this.getBalance(inputAddress, walletAddress);
    // logger.info(walletAddress);
    this.balance.set(inputAddress.toLowerCase(), balance);
    logger.info(
      `Updated balance for ${walletAddress},${inputAddress} : ${balance}`
    );
    return balance;
  }

  async getContractInfo(tokenAddress: string) {
    const token = new ethers.Contract(
      tokenAddress,
      [
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function name() view returns (string)',
      ],
      this.provider
    );
    return {
      decimals: await token.decimals(),
      symbol: await token.symbol(),
      name: await token.name(),
    };
  }

  async loadCaChe(chains: ChainConfig[]) {
    for (const chain of chains) {
      const [inputToken, outputToken] = await Promise.all([
        this.getContractInfo(chain.inputAddress),
        this.getContractInfo(chain.outputAddress),
      ]);
      await sleep(1000);
      this.cache.set(chain.inputAddress.toLowerCase(), inputToken);
      this.cache.set(chain.outputAddress.toLowerCase(), outputToken);
      logger.info(
        `Cached token info for ${inputToken.symbol} and ${outputToken.symbol}`
      );
    }
  }

  public async checkBalance(chain: ChainConfig, inputAmount: number) {
    const inputToken = this.cache.get(chain.inputAddress.toLowerCase());
    const balance = await this.getCacheBalance(chain.inputAddress);
    const amount = ethers.parseUnits(
      inputAmount.toString(),
      inputToken.decimals
    );
    if (balance < amount) {
      throw new Error(
        `Insufficient balance for ${inputToken.symbol}: required ${amount}, have ${balance}`
      );
    }
  }

  public async getPriceData(
    chain: ChainConfig,
    inputAmount: number
  ): Promise<any> {
    try {
      const inputToken = this.cache.get(chain.inputAddress.toLowerCase());
      const outputToken = this.cache.get(chain.outputAddress.toLowerCase());
      const path = `${inputToken.symbol}:${outputToken.symbol}`;

      if (path !== chain.path) {
        throw new Error(`Path mismatch: expected ${chain.path}, got ${path}`);
      }

      const amount = ethers.parseUnits(
        inputAmount.toString(),
        inputToken.decimals
      );

      const para = {
        chainId: chain.id.toString(),
        fromTokenAddress: chain.inputAddress,
        toTokenAddress: chain.outputAddress,
        userWalletAddress: this.wallet.address,
        amount: amount.toString(),
        slippage: chain.slippage,
      };

      const quote = await okxClient.dex.getSwapData(para);
      logger.info(
        `Quote for ${inputToken.symbol} -> ${
          outputToken.symbol
        }: ${ethers.formatUnits(
          quote.data[0].routerResult.toTokenAmount,
          outputToken.decimals
        )}`
      );
      return quote;
    } catch (error) {
      logger.error({ err: error }, 'Error getting price data');
      return null;
    }
  }

  public async sendTransaction(
    txData: any
  ): Promise<ethers.TransactionResponse | null> {
    try {
      const tx = await this.wallet.sendTransaction({
        to: txData.to,
        data: txData.data,
        gasLimit: txData.gas,
        maxPriorityFeePerGas: txData.maxPriorityFeePerGas,
        maxFeePerGas: txData.gasPrice * 10, // Consider making this multiplier configurable
      });
      return tx;
    } catch (error) {
      logger.error({ err: error }, 'Error sending transaction');
      return null;
    }
  }

  public async waitForTransaction(
    tx: ethers.TransactionResponse
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      // ethers.js's waitForTransaction is more efficient than polling
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      logger.error({ err: error }, `Error waiting for transaction ${tx.hash}`);
      return null;
    }
  }

  async getBalance(tokenAddress: string, address: string): Promise<bigint> {
    const rpcs = [
      'https://binance.llamarpc.com',
      'https://bsc-dataseed.bnbchain.org',
      'https://bsc-dataseed1.defibit.io',
      'https://bsc-dataseed1.ninicoin.io',
      'https://bsc-dataseed2.defibit.io',
      'https://bsc-dataseed3.defibit.io',
      'https://bsc-dataseed4.defibit.io',
      'https://bsc-dataseed2.ninicoin.io',
      'https://bsc-dataseed3.ninicoin.io',
      'https://bsc-dataseed4.ninicoin.io',
      'https://bsc-dataseed1.bnbchain.org',
      'https://bsc-dataseed2.bnbchain.org',
      'https://bsc-dataseed3.bnbchain.org',
      'https://bsc-dataseed4.bnbchain.org',
      'https://0.48.club',
      'https://bsc-pokt.nodies.app',
      'https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3',
      'https://binance.nodereal.io',
      'https://bsc.rpc.blxrbdn.com',
      'https://bsc-rpc.publicnode.com',
      'https://bsc-mainnet.public.blastapi.io',
      'https://api.zan.top/bsc-mainnet',
      'https://bsc.blockrazor.xyz',
    ];
    // 记录耗时
    const startTime = Date.now();
    const url = rpcs[Math.floor(Math.random() * rpcs.length)];
    const provider = new ethers.JsonRpcProvider(url);
    const token = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );
    const balance = await token.balanceOf(address);
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(`Balance fetched in ${duration}ms,url:${url}`);
    return balance;
  }
}
