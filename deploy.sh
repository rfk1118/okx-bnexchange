#!/bin/bash

# 远程服务器信息
REMOTE_HOST="43."
REMOTE_USER="root"
REMOTE_PATH="/root/okx/okx-bnexchange"
LOCAL_PATH="./"

echo "开始部署..."

# 使用rsync同步文件到远程服务器，排除特定目录
echo "正在上传文件..."
rsync -avz --delete \
    --exclude '.idea' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude 'node_modules' \
    --exclude 'package-lock.json' \
    $LOCAL_PATH/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# SSH连接到远程服务器执行命令
echo "正在执行远程命令..."
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
    cd /root/okx/okx-bnexchange


    # 停止并删除已存在的PM2进程
    pm2 stop okx-bnexchange || true
    pm2 delete okx-bnexchange || true

    # 安装依赖并构建
    npm install
    echo "正在安装依赖..."

    echo "正在构建项目..."
    npm run build

    # 启动新的PM2进程
    echo "正在启动服务..."
    pm2 start npm --name "okx-bnexchange" -- start

    # 显示PM2日志
    pm2 log okx-bnexchange
EOF

echo "部署完成！" 