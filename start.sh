#!/bin/bash

echo "正在启动A股行情查看器服务器..."
echo "使用Python启动HTTP服务器在5001端口..."
python3 server.py

# 如果python3命令失败，尝试使用python命令
if [ $? -ne 0 ]; then
  echo "尝试使用python命令..."
  python server.py
fi