#!/usr/bin/env python3
"""
树莓派系统监控服务器 - 增强版
提供全面的系统监控和相机功能
"""

from flask import Flask, jsonify
from flask_cors import CORS
import subprocess
import base64
import os
import time
import json
import psutil
import platform
from datetime import datetime

app = Flask(__name__)
CORS(app)

CAPTURE_PATH = "/tmp/pi_capture.jpg"
METRICS_FILE = "/tmp/pi_metrics.json"

# ============ 系统信息收集 ============

def get_cpu_info():
    """获取 CPU 详细信息"""
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
    
    # 获取每个核心的使用率
    per_cpu = psutil.cpu_percent(interval=0.1, percpu=True)
    
    return {
        'usage': round(cpu_percent, 1),
        'cores': cpu_count,
        'frequency': round(cpu_freq.current, 1) if cpu_freq else 0,
        'temperature': round(temp, 1),
        'per_core': [round(x, 1) for x in per_cpu],
        'load_avg': [round(x, 2) for x in os.getloadavg()]
    }

def get_memory_info():
    """获取内存详细信息"""
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    
    return {
        'total': round(mem.total / (1024**3), 2),  # GB
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
    partitions = []
    
    for part in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(part.mountpoint)
            partitions.append({
                'device': part.device,
                'mountpoint': part.mountpoint,
                'fstype': part.fstype,
                'total': round(usage.total / (1024**3), 2),
                'used': round(usage.used / (1024**3), 2),
                'free': round(usage.free / (1024**3), 2),
                'percent': usage.percent
            })
        except:
            pass
    
    return {
        'total': round(disk.total / (1024**3), 2),
        'used': round(disk.used / (1024**3), 2),
        'free': round(disk.free / (1024**3), 2),
        'percent': disk.percent,
        'partitions': partitions
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
        'packets_sent': net_io.packets_sent,
        'packets_recv': net_io.packets_recv,
        'interfaces': interfaces
    }

def get_system_info():
    """获取系统基本信息"""
    boot_time = datetime.fromtimestamp(psutil.boot_time())
    uptime = datetime.now() - boot_time
    
    return {
        'platform': platform.platform(),
        'machine': platform.machine(),
        'processor': platform.processor(),
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
    
    # 按 CPU 使用率排序
    processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
    return processes[:10]  # 只返回前10个

def get_gpu_info():
    """获取 GPU 信息（树莓派特定）"""
    gpu_info = {'temperature': 0, 'memory': 0}
    
    try:
        # 尝试获取 GPU 温度
        result = subprocess.run(['vcgencmd', 'measure_temp'], capture_output=True, text=True)
        if result.returncode == 0:
            temp_str = result.stdout.strip().replace('temp=', '').replace("'C", '')
            gpu_info['temperature'] = float(temp_str)
    except:
        pass
    
    try:
        # 获取 GPU 内存
        result = subprocess.run(['vcgencmd', 'get_mem', 'gpu'], capture_output=True, text=True)
        if result.returncode == 0:
            mem_str = result.stdout.strip().replace('gpu=', '').replace('M', '')
            gpu_info['memory'] = int(mem_str)
    except:
        pass
    
    return gpu_info

# ============ API 路由 ============

@app.route('/api/metrics', methods=['GET'])
def get_all_metrics():
    """获取所有系统指标"""
    try:
        metrics = {
            'timestamp': int(time.time() * 1000),
            'cpu': get_cpu_info(),
            'memory': get_memory_info(),
            'disk': get_disk_info(),
            'network': get_network_info(),
            'system': get_system_info(),
            'gpu': get_gpu_info(),
            'top_processes': get_process_info()
        }
        
        # 保存到文件供其他脚本使用
        with open(METRICS_FILE, 'w') as f:
            json.dump(metrics, f)
        
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/system', methods=['GET'])
def get_system():
    """获取系统基本信息"""
    return jsonify(get_system_info())

@app.route('/api/cpu', methods=['GET'])
def get_cpu():
    """获取 CPU 信息"""
    return jsonify(get_cpu_info())

@app.route('/api/memory', methods=['GET'])
def get_memory():
    """获取内存信息"""
    return jsonify(get_memory_info())

@app.route('/api/disk', methods=['GET'])
def get_disk():
    """获取磁盘信息"""
    return jsonify(get_disk_info())

@app.route('/api/network', methods=['GET'])
def get_network():
    """获取网络信息"""
    return jsonify(get_network_info())

@app.route('/api/processes', methods=['GET'])
def get_processes():
    """获取进程列表"""
    return jsonify(get_process_info())

@app.route('/capture', methods=['POST'])
def capture():
    """拍摄照片"""
    try:
        cmd = [
            'rpicam-still',
            '-o', CAPTURE_PATH,
            '--width', '1920',
            '--height', '1080',
            '--timeout', '1000',
            '--nopreview'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        
        if result.returncode != 0:
            return jsonify({
                'success': False,
                'error': f'Capture failed: {result.stderr}'
            }), 500
        
        with open(CAPTURE_PATH, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        if os.path.exists(CAPTURE_PATH):
            os.remove(CAPTURE_PATH)
        
        return jsonify({
            'success': True,
            'image': image_data,
            'timestamp': int(time.time() * 1000)
        })
        
    except subprocess.TimeoutExpired:
        return jsonify({'success': False, 'error': 'Capture timeout'}), 504
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'timestamp': int(time.time() * 1000)
    })

if __name__ == '__main__':
    print("🚀 Pi Monitor Server (Enhanced) starting on http://0.0.0.0:5000")
    print("📊 Endpoints:")
    print("  GET  /api/metrics    - All system metrics")
    print("  GET  /api/system     - System info")
    print("  GET  /api/cpu        - CPU details")
    print("  GET  /api/memory     - Memory details")
    print("  GET  /api/disk       - Disk details")
    print("  GET  /api/network    - Network details")
    print("  GET  /api/processes  - Top processes")
    print("  POST /capture        - Capture photo")
    app.run(host='0.0.0.0', port=5000, debug=False)
