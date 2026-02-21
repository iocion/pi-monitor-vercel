import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOCAL_PI_API = process.env.LOCAL_PI_API || 'http://localhost:5000';

export async function GET() {
  try {
    // 尝试从本地树莓派服务器获取详细指标
    const res = await fetch(`${LOCAL_PI_API}/api/metrics`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error('Local Pi service not available');
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    // 返回模拟数据用于演示
    return NextResponse.json({
      timestamp: Date.now(),
      cpu: {
        usage: 15.5,
        cores: 4,
        frequency: 2400,
        temperature: 45.2,
        per_core: [12, 18, 14, 16],
        load_avg: [0.15, 0.12, 0.10]
      },
      memory: {
        total: 7.63,
        available: 5.21,
        used: 2.42,
        percent: 31.7,
        swap_total: 2.0,
        swap_used: 0.1,
        swap_percent: 5.0
      },
      disk: {
        total: 58.2,
        used: 12.8,
        free: 45.4,
        percent: 22.0,
        partitions: [
          {
            device: '/dev/mmcblk0p2',
            mountpoint: '/',
            fstype: 'ext4',
            total: 58.2,
            used: 12.8,
            free: 45.4,
            percent: 22.0
          }
        ]
      },
      network: {
        bytes_sent: 12345678,
        bytes_recv: 87654321,
        packets_sent: 123456,
        packets_recv: 654321,
        interfaces: [
          {
            name: 'wlan0',
            addresses: [
              { address: '192.168.1.100', netmask: '255.255.255.0', broadcast: '192.168.1.255' }
            ]
          }
        ]
      },
      system: {
        platform: 'Linux-6.1.21-v8+-aarch64-with-glibc2.36',
        machine: 'aarch64',
        processor: 'ARMv8',
        hostname: 'raspberrypi',
        python_version: '3.11.2',
        boot_time: '2024-01-15T08:30:00',
        uptime_seconds: 86400,
        uptime_formatted: '1 day, 0:00:00'
      },
      gpu: {
        temperature: 42.5,
        memory: 76
      },
      top_processes: [
        { pid: 1234, name: 'python3', cpu_percent: 5.2, memory_percent: 3.1 },
        { pid: 5678, name: 'node', cpu_percent: 3.1, memory_percent: 2.8 }
      ],
      _demo: true
    });
  }
}
