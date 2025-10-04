#!/bin/bash

# 远程服务器信息
REMOTE_HOST="43"
REMOTE_USER="root"

# SSH连接到远程服务器执行命令
echo "正在执行远程命令..."
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
    pm2 log okx-bnexchange
EOF

echo "部署完成！" 