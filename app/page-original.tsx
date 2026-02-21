'use client';

import { useState, useEffect } from 'react';
import { Camera, RefreshCw, Thermometer, Cpu, HardDrive } from 'lucide-react';

interface Metrics {
  timestamp: number;
  cpu_temp: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--');
  const [error, setError] = useState<string | null>(null);

  // 获取指标数据
  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      setMetrics(data);
      setLastUpdate(new Date(data.timestamp).toLocaleTimeString('zh-CN'));
    } catch (e) {
      console.error('Failed to fetch metrics');
    }
  };

  // 拍摄照片
  const capturePhoto = async () => {
    setIsCapturing(true);
    setError(null);
    try {
      const res = await fetch('/api/capture', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.image) {
        setCapturedImage(`data:image/jpeg;base64,${data.image}`);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (e) {
      setError('拍摄服务不可用，请确保树莓派本地服务器已启动');
    } finally {
      setIsCapturing(false);
    }
  };

  // 初始加载和定时刷新
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-6 md:p-10">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* 头部 */}
        <header className="mb-10">
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                  树莓派监控中心
                </h1>
                <p className="text-slate-400 text-sm">Raspberry Pi 5 实时监控</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  更新于 {lastUpdate}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 指标卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={Thermometer}
            label="CPU 温度"
            value={metrics?.cpu_temp}
            unit="°C"
            color="orange"
          />
          <MetricCard
            icon={Cpu}
            label="CPU 负载"
            value={metrics?.cpu_usage}
            unit="%"
            color="blue"
          />
          <MetricCard
            icon={RefreshCw}
            label="内存占用"
            value={metrics?.memory_usage}
            unit="%"
            color="purple"
          />
          <MetricCard
            icon={HardDrive}
            label="磁盘空间"
            value={metrics?.disk_usage}
            unit="%"
            color="emerald"
          />
        </div>

        {/* 拍摄区域 */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/20 rounded-xl">
                <Camera className="text-pink-300" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">相机拍摄</h2>
                <p className="text-xs text-slate-400">IMX219 摄像头模块</p>
              </div>
            </div>
            <button
              onClick={capturePhoto}
              disabled={isCapturing}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-sm transition-all duration-200 shadow-lg shadow-pink-500/20"
            >
              {isCapturing ? '拍摄中...' : '点击拍摄'}
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-300 text-sm">{error}</p>
              <p className="text-slate-400 text-xs mt-1">
                请在树莓派上运行: python3 pi-server/server.py
              </p>
            </div>
          )}

          {/* 图片显示区域 */}
          {capturedImage ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full max-h-[500px] object-contain bg-black/50"
              />
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={() => setCapturedImage(null)}
                  className="px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur rounded-lg text-xs text-white transition-colors"
                >
                  清除图片
                </button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-black/30 rounded-xl border border-dashed border-white/10">
              <div className="text-center">
                <Camera className="mx-auto mb-3 text-slate-600" size={48} />
                <p className="text-slate-500 text-sm">点击上方按钮拍摄照片</p>
              </div>
            </div>
          )}
        </div>

        {/* 底部 */}
        <footer className="text-center">
          <p className="text-xs text-slate-600 font-mono">
            Raspberry Pi 5 • Next.js • Upstash Redis • Vercel
          </p>
        </footer>
      </div>
    </div>
  );
}

// 指标卡片组件
interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value?: number;
  unit: string;
  color: 'orange' | 'blue' | 'purple' | 'emerald';
}

function MetricCard({ icon: Icon, label, value, unit, color }: MetricCardProps) {
  const colorClasses = {
    orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  return (
    <div className="glass rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white tabular-nums">
          {value ?? '--'}
        </span>
        <span className="text-sm text-slate-500">{unit}</span>
      </div>
    </div>
  );
}
