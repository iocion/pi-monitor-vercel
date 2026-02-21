import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 这个API端点需要配合本地服务器使用
// 树莓派需要运行本地服务来处理实际的拍摄请求
const LOCAL_PI_API = process.env.LOCAL_PI_API || 'http://localhost:5000';

export async function POST() {
  try {
    // 尝试调用树莓派本地服务
    const res = await fetch(`${LOCAL_PI_API}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!res.ok) {
      throw new Error('Local Pi service not available');
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    // 如果本地服务不可用，返回模拟数据或错误
    return NextResponse.json(
      { 
        error: 'Camera service not available. Please ensure the local Pi server is running.',
        hint: 'Run: python3 /home/iocion/.openclaw/workspace/pi-monitor-vercel/pi-server/server.py'
      },
      { status: 503 }
    );
  }
}
