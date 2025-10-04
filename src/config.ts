import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { decrypt } from './util/utils';

dotenv.config();

const envSchema = z.object({
  BYBIT_API_KEY: z.string().min(1),
  BYBIT_API_SECRET: z.string().min(1),
  OKX_API_KEY: z.string().min(1),
  OKX_SECRET_KEY: z.string().min(1),
  OKX_API_PASSPHRASE: z.string().min(1),
  OKX_PROJECT_ID: z.string().min(1),
  EVM_RPC_URL: z.string().url(),
  EVM_PRIVATE_KEY_ENCRYPTED: z.string().min(1),
  EVM_PRIVATE_KEY_SALT: z.string().min(1),
  EVM_PRIVATE_KEY_PASSWORD: z.string().min(1),
});

const configSchema = z.object({
  maxSellAmount: z.number(),
  maxTradeFee: z.number(),
  balanceSafetyFactor: z.number(),
  chain: z.array(
    z.object({
      tokenSymbol: z.string(),
      category: z.enum(['linear', 'spot']),
      side: z.enum(['Buy', 'Sell']),
      tokenAmount: z.number(),
      tokenMinAmount: z.number(),
      inputAddress: z.string(),
      outputAddress: z.string(),
      path: z.string(),
      id: z.number(),
      slippage: z.string(),
    })
  ),
});

const parsedEnv = envSchema.parse(process.env);

const configPath = path.resolve(__dirname, '../config.json');
const configFile = fs.readFileSync(configPath, 'utf-8');
const parsedConfig = configSchema.parse(JSON.parse(configFile));

const decryptedPrivateKey = decrypt(
  parsedEnv.EVM_PRIVATE_KEY_ENCRYPTED,
  parsedEnv.EVM_PRIVATE_KEY_SALT,
  parsedEnv.EVM_PRIVATE_KEY_PASSWORD
);

export const config = {
  bybit: {
    apiKey: parsedEnv.BYBIT_API_KEY,
    apiSecret: parsedEnv.BYBIT_API_SECRET,
  },
  okx: {
    apiKey: parsedEnv.OKX_API_KEY,
    secretKey: parsedEnv.OKX_SECRET_KEY,
    apiPassphrase: parsedEnv.OKX_API_PASSPHRASE,
    projectId: parsedEnv.OKX_PROJECT_ID,
  },
  evm: {
    rpcUrl: parsedEnv.EVM_RPC_URL,
    privateKey: decryptedPrivateKey,
  },
  ...parsedConfig,
  mysql: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
  },
};
