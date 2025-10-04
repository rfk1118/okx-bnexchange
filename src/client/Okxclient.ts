import { OKXDexClient } from '@okx-dex/okx-dex-sdk';
import { config } from '../config';
import { createEVMWallet } from '@okx-dex/okx-dex-sdk/dist/core/evm-wallet';
import { ethers } from 'ethers';

// https://web3.okx.com/zh-hans/build/dev-docs/dex-api/dex-sdk-evm
// 注意滑点
// slippage: '0.005' // 0.5% slippage
class OKXClientManager {
  private client: OKXDexClient;

  constructor() {
    this.client = new OKXDexClient({
      apiKey: config.okx.apiKey,
      secretKey: config.okx.secretKey,
      apiPassphrase: config.okx.apiPassphrase,
      projectId: config.okx.projectId,
      evm: {
        wallet: createEVMWallet(
          config.evm.privateKey,
          new ethers.JsonRpcProvider(config.evm.rpcUrl)
        ),
      },
    });
  }

  public getClient(): OKXDexClient {
    return this.client;
  }
}

const okxClientManager = new OKXClientManager();
export const okxClient = okxClientManager.getClient();
