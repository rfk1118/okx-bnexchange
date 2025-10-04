import ccxt from 'ccxt';
import { config } from '../config';
import axios from 'axios';

export class Bn {
  private client = new ccxt.binance({
    apiKey: config.bybit.apiKey,
    secret: config.bybit.apiSecret,
  });

  async BnPrice(
    tokenSymbol: string,
    category: 'linear' | 'spot'
  ): Promise<any> {
    // https://developers.binance.com/docs/zh-CN/derivatives/usds-margined-futures/market-data/rest-api/Order-Book
    // https://api.binance.com/fapi/v1/depth
    // https://api.binance.com/api/v3/depth
    // https://api.binance.com/api/v3/depth?symbol=ETHUSDT
    if (category === 'linear') {
      const response = await axios.get(
        `https://fapi.binance.com/fapi/v1/depth?symbol=${tokenSymbol}USDT`
      );
      return response.data;
    } else {
      const response = await axios.get(
        `https://api.binance.com/api/v3/depth?symbol=${tokenSymbol}USDT`
      );
      return response.data;
    }
  }

  async createBybitOrder(
    tokenSymbol: string,
    category: 'linear' | 'spot',
    side: 'Buy' | 'Sell',
    qty: string
  ): Promise<any> {
    try {
      if (category === 'linear') {
        // 修改符号
        const funtureSymbol = tokenSymbol + '/USDT:USDT';
        // const order = await bn.createOrder("ETH/USDT:USDT","market","buy",0.02); 合约下单代码
        //   const order = await bn.createOrder("ETH/USDT:USDT","market","Sell",0.02);
        return await this.client.createOrder(
          funtureSymbol,
          'market',
          side,
          Number(qty)
        );
      } else {
        // const order = await bn.createOrder("ETH/USDT","market","Buy",0.01);
        const spotSymbol = tokenSymbol + '/USDT';
        return await this.client.createOrder(
          spotSymbol,
          'market',
          side,
          Number(qty)
        );
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
