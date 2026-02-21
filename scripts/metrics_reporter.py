#!/usr/bin/env python3
"""
树莓派系统监控数据上报脚本
定期收集系统指标并发送到 Redis/Upstash
"""

import json
import time
import psutil
import platform
import requests
import os
from datetime import datetime

# Upstash Redis 配置
UPSTASH_URL = os.getenv('UPSTASH_REDIS_REST_URL', 'https://good-cattle-9550.upstash.io')
UPSTASH_TOKEN = os.getenv('UPSTASH_REDIS_REST_TOKEN', 'your-token-here')

def get_metrics():
    """收集系统指标"""
    # CPU
    cpu_percent = psutil.cpu_percent(interval=1)
    cpu_temp = 0
    try:
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            cpu_temp = int(f.read().strip()) / 1000
    except:
        pass
    
    # 内存
    mem = psutil.virtual_memory()
    
    # 磁盘
    disk = psutil.disk_usage('/')
    
    # 启动时间
    boot_time = datetime.fromtimestamp(psutil.boot_time())
    uptime = datetime.now() - boot_time
    
    return {
        'timestamp': int(time.time() * 1000),
        'cpu_temp': round(cpu_temp, 1),
        'cpu_usage': round(cpu_percent, 1),
        'memory_usage': mem.percent,
        'disk_usage': disk.percent,
        'uptime_seconds': int(uptime.total_seconds()),
        'uptime_formatted': str(uptime).split('.')[0]
    }

def send_to_upstash(metrics):
    """发送数据到 Upstash Redis"""
    try:
        url = f"{UPSTASH_URL}/set/pi_metrics"
        headers = {
            'Authorization': f'Bearer {UPSTASH_TOKEN}',
            'Content-Type': 'application/json'
        }
        data = {
            'value': json.dumps(metrics)
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=10)
        return response.ok
    except Exception as e:
        print(f"Error sending to Upstash: {e}")
        return False

def main():
    print("🚀 Pi Metrics Reporter started")
    print(f"⏱️  Reporting interval: 30 seconds")
    print(f"📊 Upstash URL: {UPSTASH_URL}")
    
    while True:
        try:
            # 收集指标
            metrics = get_metrics()
            
            # 发送到 Upstash
            if send_to_upstash(metrics):
                print(f"✅ {datetime.now().strftime('%H:%M:%S')} - Metrics sent: CPU {metrics['cpu_usage']}% | Temp {metrics['cpu_temp']}°C")
            else:
                print(f"❌ {datetime.now().strftime('%H:%M:%S')} - Failed to send metrics")
            
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # 等待 30 秒
        time.sleep(30)

if __name__ == '__main__':
    main()
