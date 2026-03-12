#!/usr/bin/env python3
"""
树莓派监控脚本 - 轻量级版本
持续收集系统指标并写入 Redis
"""

import time
import json
import psutil
import platform
import os
import requests
from datetime import datetime

# Upstash Configuration
UPSTASH_URL = "https://good-cattle-9550.upstash.io"
UPSTASH_TOKEN = "ASVOAAImcDE0YTBlOTI5ZDQ0MDQ0NGFkOTYxYjlhMzdmODAyMmI1ZnAxOTU1MA"

def get_cpu_info():
    """获取 CPU 信息"""
    cpu_percent = psutil.cpu_percent(interval=1)
    cpu_count = psutil.cpu_count()
    cpu_freq = psutil.cpu_freq()
    
    # 获取 CPU 温度（树莓派特定）
    temp = 0
    try:
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            temp = int(f.read().strip()) / 1000
    except:
        pass
    
    per_cpu = psutil.cpu_percent(interval=0.1, percpu=True)
    
    return {
        'usage': round(cpu_percent, 1),
        'cores': cpu_count,
        'frequency': round(cpu_freq.current, 1) if cpu_freq else 2400,
        'temperature': round(temp, 1),
        'per_core': [round(x, 1) for x in per_cpu],
        'load_avg': [round(x, 2) for x in os.getloadavg()]
    }

def get_memory_info():
    """获取内存信息"""
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    
    return {
        'total': round(mem.total / (1024**3), 2),
        'available': round(mem.available / (1024**3), 2),
        'used': round(mem.used / (1024**3), 2),
        'percent': mem.percent,
        'swap_total': round(swap.total / (1024**3), 2),
        'swap_used': round(swap.used / (1024**3), 2),
        'swap_percent': swap.percent
    }

def get_disk_info():
    """获取磁盘信息"""
    disk = psutil.disk_usage('/')
    
    return {
        'total': round(disk.total / (1024**3), 2),
        'used': round(disk.used / (1024**3), 2),
        'free': round(disk.free / (1024**3), 2),
        'percent': disk.percent
    }

def get_network_info():
    """获取网络信息"""
    net_io = psutil.net_io_counters()
    net_if = psutil.net_if_addrs()
    
    interfaces = []
    for name, addrs in net_if.items():
        iface_addrs = []
        for addr in addrs:
            if addr.family == 2:  # AF_INET (IPv4)
                iface_addrs.append({
                    'address': addr.address,
                    'netmask': addr.netmask,
                    'broadcast': addr.broadcast
                })
        if iface_addrs:
            interfaces.append({
                'name': name,
                'addresses': iface_addrs
            })
    
    return {
        'bytes_sent': net_io.bytes_sent,
        'bytes_recv': net_io.bytes_recv,
        'interfaces': interfaces
    }

def get_system_info():
    """获取系统信息"""
    boot_time = datetime.fromtimestamp(psutil.boot_time())
    uptime = datetime.now() - boot_time
    
    return {
        'platform': platform.platform(),
        'machine': platform.machine(),
        'processor': platform.processor() or 'ARM',
        'hostname': platform.node(),
        'python_version': platform.python_version(),
        'boot_time': boot_time.isoformat(),
        'uptime_seconds': int(uptime.total_seconds()),
        'uptime_formatted': str(uptime).split('.')[0]
    }

def get_process_info():
    """获取进程信息"""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            if proc.info['cpu_percent'] > 0.1 or proc.info['memory_percent'] > 0.1:
                processes.append({
                    'pid': proc.info['pid'],
                    'name': proc.info['name'],
                    'cpu_percent': round(proc.info['cpu_percent'], 1),
                    'memory_percent': round(proc.info['memory_percent'], 1)
                })
        except:
            pass
    
    processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
    return processes[:10]

def get_metrics():
    """获取完整系统指标"""
    return {
        'timestamp': int(time.time() * 1000),
        'cpu': get_cpu_info(),
        'memory': get_memory_info(),
        'disk': get_disk_info(),
        'network': get_network_info(),
        'system': get_system_info(),
        'top_processes': get_process_info()
    }

def push_metrics(metrics):
    """推送指标到 Redis"""
    try:
        url = f"{UPSTASH_URL}/set/pi:metrics"
        headers = {
            'Authorization': f'Bearer {UPSTASH_TOKEN}',
            'Content-Type': 'application/json'
        }
        data = json.dumps(metrics)
        
        response = requests.post(url, headers=headers, data=data, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ [{datetime.now().strftime('%H:%M:%S')}] Data pushed: CPU {metrics['cpu']['usage']:.1f}%, Temp {metrics['cpu']['temperature']:.1f}°C")
            return True
        else:
            print(f"❌ Failed to push: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"⚠️ Error pushing metrics: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Pi Monitor...")
    print(f"   Redis URL: {UPSTASH_URL}")
    print(f"   Key: pi:metrics")
    print(f"   Interval: 5 seconds")
    print("-" * 50)
    
    # 立即推送一次
    metrics = get_metrics()
    push_metrics(metrics)
    
    # 循环推送
    while True:
        time.sleep(5)
        metrics = get_metrics()
        push_metrics(metrics)
