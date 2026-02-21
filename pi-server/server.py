#!/usr/bin/env python3
"""
树莓派本地相机服务器
运行在树莓派上，处理拍摄请求并返回图片
"""

from flask import Flask, jsonify
from flask_cors import CORS
import subprocess
import base64
import os
import time

app = Flask(__name__)
CORS(app)  # 允许跨域请求

CAPTURE_PATH = "/tmp/pi_capture.jpg"

@app.route('/capture', methods=['POST'])
def capture():
    """拍摄照片并返回 base64 编码的图片"""
    try:
        # 使用 rpicam-still 拍摄照片
        cmd = [
            'rpicam-still',
            '-o', CAPTURE_PATH,
            '--width', '1920',
            '--height', '1080',
            '--timeout', '1000',  # 1秒预览后拍摄
            '--nopreview'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        
        if result.returncode != 0:
            return jsonify({
                'success': False,
                'error': f'Capture failed: {result.stderr}'
            }), 500
        
        # 读取图片并转为 base64
        with open(CAPTURE_PATH, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        # 清理临时文件
        if os.path.exists(CAPTURE_PATH):
            os.remove(CAPTURE_PATH)
        
        return jsonify({
            'success': True,
            'image': image_data,
            'timestamp': int(time.time() * 1000)
        })
        
    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'error': 'Capture timeout'
        }), 504
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("🚀 Pi Camera Server starting on http://0.0.0.0:5000")
    print("📷 Camera endpoint: POST http://localhost:5000/capture")
    app.run(host='0.0.0.0', port=5000, debug=False)
