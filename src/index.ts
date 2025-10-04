import dotenv from 'dotenv';
dotenv.config();
import { config } from './config';
import { Bn } from './client/Bn';
import { ChainService } from './chain/ChainService';
import { TradeManager, ChainConfig } from './business';
import { logger } from './util/logger';

const bn = new Bn();
const chainService = new ChainService();
const tradeManager = new TradeManager(
  bn,
  chainService,
  config.maxSellAmount,
  config.maxTradeFee,
  config.balanceSafetyFactor
);

async function once(chain: ChainConfig) {
  try {
    await tradeManager.process(chain);
  } catch (error) {
    logger.error(
      { err: error },
      `Error processing record for ${chain.tokenSymbol}`
    );
  }
}

async function main() {
  try {
    await chainService.loadCaChe(config.chain as ChainConfig[]);
    logger.info('Starting trading bot...');

    // Use a more robust loop with Promise.allSettled
    while (true) {
      const results = await Promise.allSettled(
        config.chain.map((chain) => once(chain as ChainConfig))
      );

      results.forEach((result) => {
        if (result.status === 'rejected') {
          logger.error({ err: result.reason }, 'A trade task failed');
        }
      });

      // Optional: Add a delay to prevent high CPU usage in a tight loop
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
    }
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start trading bot');
    process.exit(1);
  }
}

main();
