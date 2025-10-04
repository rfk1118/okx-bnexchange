#!/bin/bash

# 远程服务器信息
REMOTE_HOST="124."
REMOTE_USER="ubuntu"

# SSH连接到远程服务器执行命令
echo "正在执行远程命令..."
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
    cd /home/ubuntu/okx-dex
    rm .env
    pm2 status
EOF

echo "部署完成！" 