# OKX-BN Exchange Arbitrage Bot

## ⚠️ 免责声明 / DISCLAIMER

**本项目仅供学习和研究使用，不构成任何投资建议。**

- 使用本软件进行交易的所有风险由用户自行承担
- 加密货币交易存在极高风险，可能导致全部本金损失
- 作者不对因使用本软件而产生的任何直接或间接损失负责
- 请确保您完全理解相关风险后再使用本软件
- 使用本软件即表示您同意自行承担所有风险和责任

**THIS PROJECT IS FOR EDUCATIONAL AND RESEARCH PURPOSES ONLY.**

- All trading risks are borne by the user
- Cryptocurrency trading carries significant risks and may result in total capital loss
- The author is not responsible for any direct or indirect losses resulting from the use of this software
- Please ensure you fully understand the risks before using this software
- By using this software, you agree to assume all risks and responsibilities

---

## 🚫 项目状态 / Project Status

**本项目已停止维护 / THIS PROJECT IS NO LONGER MAINTAINED**

该项目不再接受更新、bug修复或新功能请求。请自行评估风险后使用。

This project is no longer accepting updates, bug fixes, or new feature requests. Use at your own risk.

---

## 📋 项目简介 / Project Overview

这是一个基于 TypeScript 开发的加密货币套利交易机器人，用于在 OKX DEX 和币安 (Binance) 交易所之间进行价差套利交易。

An automated cryptocurrency arbitrage trading bot built with TypeScript, designed to execute arbitrage opportunities between OKX DEX and Binance exchange.

### 核心功能 / Core Features

- **跨平台套利**: 在 OKX DEX (链上) 和币安 (中心化交易所) 之间监控价差
- **自动交易执行**: 当发现有利可图的套利机会时自动执行交易
- **风险控制**: 内置价格影响检测、手续费检测和余额安全因子
- **多链支持**: 支持 EVM 兼容链 (如 BSC)
- **实时监控**: 持续监控市场价格并记录交易日志

- **Cross-platform Arbitrage**: Monitors price spreads between OKX DEX (on-chain) and Binance (centralized exchange)
- **Automated Trade Execution**: Automatically executes trades when profitable arbitrage opportunities are detected
- **Risk Management**: Built-in price impact detection, fee monitoring, and balance safety factors
- **Multi-chain Support**: Supports EVM-compatible chains (e.g., BSC)
- **Real-time Monitoring**: Continuous market price monitoring with comprehensive logging

---

## 🛠️ 技术栈 / Tech Stack

- **语言**: TypeScript
- **主要依赖**:
  - `@okx-dex/okx-dex-sdk`: OKX DEX 交易接口
  - `binance`: 币安交易所 API
  - `ccxt`: 统一加密货币交易所 API
  - `ethers`: 以太坊/EVM 链交互
  - `mysql2`: 数据库存储 (可选)
  - `pino`: 日志记录

---

## 📦 安装 / Installation

```bash
# 克隆仓库
git clone <repository-url>
cd okx-bnexchange

# 安装依赖
npm install

# 编译 TypeScript
npm run build
```

---

## ⚙️ 配置 / Configuration

### 1. 环境变量配置

复制 `.env.example` 为 `.env` 并填写必要的 API 密钥:

```bash
cp .env.example .env
```

需要配置的环境变量:
- `BYBIT_API_KEY`: 币安 API Key
- `BYBIT_API_SECRET`: 币安 API Secret
- `OKX_API_KEY`: OKX API Key
- `OKX_SECRET_KEY`: OKX Secret Key
- `OKX_API_PASSPHRASE`: OKX API Passphrase
- `OKX_PROJECT_ID`: OKX Project ID
- `EVM_RPC_URL`: EVM 链 RPC 节点地址
- `EVM_PRIVATE_KEY_ENCRYPTED`: 加密的私钥
- `EVM_PRIVATE_KEY_SALT`: 私钥加密盐值
- `EVM_PRIVATE_KEY_PASSWORD`: 私钥解密密码
- `MYSQL_*`: MySQL 数据库配置 (可选)

### 2. 交易配置

编辑 `config.json` 文件配置交易参数:

```json
{
  "maxSellAmount": 2000,           // 最大卖出金额 (USDT)
  "maxTradeFee": 0.5,              // 最大可接受手续费 (USDT)
  "balanceSafetyFactor": 2,        // 余额安全系数
  "chain": [
    {
      "id": 56,                    // 链 ID (56 = BSC)
      "inputAddress": "0x...",     // 输入代币地址
      "outputAddress": "0x...",    // 输出代币地址
      "path": "XPIN:USDT",         // 交易对
      "tokenAmount": 100000,       // 交易数量
      "tokenMinAmount": 1,         // 最小套利利润
      "slippage": "0.001",         // 滑点容忍度
      "tokenSymbol": "XPIN",       // 代币符号
      "category": "linear",        // 交易类型: linear/spot
      "side": "Buy"                // 交易方向: Buy/Sell
    }
  ]
}
```

---

## 🚀 运行 / Usage

```bash
# 开发模式 (带热重载)
npm run dev

# 生产模式
npm run build
npm start
```

---

## 📁 项目结构 / Project Structure

```
okx-bnexchange/
├── src/
│   ├── business.ts          # 核心交易逻辑
│   ├── index.ts             # 应用入口
│   ├── config.ts            # 配置管理
│   ├── client/
│   │   ├── Bn.ts           # 币安客户端
│   │   └── Okxclient.ts    # OKX 客户端
│   ├── chain/
│   │   └── ChainService.ts # 区块链交互服务
│   └── util/
│       ├── logger.ts       # 日志工具
│       ├── mysql.ts        # 数据库工具
│       ├── check.ts        # 检查工具
│       └── utils.ts        # 通用工具
├── config.json              # 交易配置
├── .env.example             # 环境变量示例
└── package.json
```

---

## ⚙️ 核心工作流程 / Workflow

1. **价格监控**: 持续获取 OKX DEX 和币安的实时价格
2. **价差计算**: 计算两个平台之间的价格差异
3. **风险评估**:
   - 检查价格影响是否在可接受范围内
   - 验证手续费是否超过阈值
   - 确认账户余额充足
4. **交易执行**:
   - 在链上执行 DEX 交易
   - 在币安执行对冲交易
5. **结果记录**: 记录交易哈希和订单信息

---

## 🔧 开发工具 / Development Tools

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint

# 代码修复
npm run lint:fix
```

---

## 📝 日志 / Logging

项目使用 `pino` 进行日志记录，支持:
- 结构化日志输出
- 不同日志级别 (info, warn, error, fatal)
- 美化输出格式

查看日志:
```bash
./showlog.sh
```

---

## 🔐 安全建议 / Security Recommendations

- **永远不要提交包含真实 API 密钥的 `.env` 文件**
- 使用强密码保护私钥
- 定期轮换 API 密钥
- 限制 API 密钥的权限范围
- 在测试环境中使用小额资金
- 启用交易所的 IP 白名单

---

## ⚠️ 风险提示 / Risk Warning

1. **市场风险**: 加密货币市场波动剧烈，价格可能瞬间变化
2. **滑点风险**: 实际成交价格可能与预期不符
3. **流动性风险**: 大额交易可能面临流动性不足
4. **技术风险**: 网络延迟、API 故障等可能导致交易失败
5. **智能合约风险**: DEX 智能合约可能存在未知漏洞
6. **监管风险**: 各地区对加密货币交易的监管政策可能变化

---

## 📄 许可证 / License

ISC

---

## ❌ 不提供支持 / No Support

由于项目已停止维护，作者不再提供任何形式的技术支持、咨询或协助。

As the project is no longer maintained, the author no longer provides any form of technical support, consultation, or assistance.

---

**最后更新 / Last Updated**: 2025-10-04
