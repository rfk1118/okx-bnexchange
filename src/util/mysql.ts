import mysql from 'mysql2/promise';
import { config } from '../config';

const pool = mysql.createPool(config.mysql);

export async function insertOrder(
  txHash: string,
  chainName: string,
  exchangeName: string,
  exchangeOrderId: string,
  strategyName: string,
  spot: boolean
) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'INSERT INTO chain_exchange_orders (tx_hash, chain_name, exchange_name, exchange_order_id, strategy_name,spot) VALUES (?, ?, ?, ?, ?,?)',
      [txHash, chainName, exchangeName, exchangeOrderId, strategyName, spot]
    );
    return rows;
  } finally {
    connection.release();
  }
}
