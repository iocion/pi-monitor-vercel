#!/bin/bash
# Pi Monitor 启动脚本
# 添加到 crontab: @reboot /home/iocion/.openclaw/workspace/pi-monitor-vercel/start-monitor.sh

export UPSTASH_REDIS_REST_URL="https://good-cattle-9550.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="ASVOAAImcDE0YTBlOTI5ZDQ0MDQ0NGFkOTYxYjlhMzdmODAyMmI1ZnAxOTU1MA"

# 杀掉旧的进程
pkill -f "monitor.py" 2>/dev/null
sleep 1

# 启动新的监控进程
cd /home/iocion/.openclaw/workspace/pi-monitor-vercel
nohup python3 scripts/monitor.py > /tmp/monitor.log 2>&1 &
echo "Pi Monitor started with PID: $!"
