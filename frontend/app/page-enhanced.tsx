'use client';

import { useState, useEffect } from 'react';
import { 
  Camera, RefreshCw, Thermometer, Cpu, HardDrive, 
  MemoryStick, Network, Activity, Clock, Server,
  ChevronDown, ChevronUp, Wifi, Disc
} from 'lucide-react';

// 类型定义
interface CPUInfo {
  usage: number;
  cores: number;
  frequency: number;
  temperature: number;
  per_core: number[];
  load_avg: number[];
}

interface MemoryInfo {
  total: number;
  available: number;
  used: number;
  percent: number;
  swap_total: number;
  swap_used: number;
  swap_percent: number;
}

interface DiskInfo {
  total: number;
  used: number;
  free: number;
  percent: number;
  partitions: Array<{
    device: string;
    mountpoint: string;
    fstype: string;
    total: number;
    used: number;
    free: number;
    percent: number;
  }>;
}

interface NetworkInfo {
  bytes_sent: number;
  bytes_recv: number;
  packets_sent: number;
  packets_recv: number;
  interfaces: Array<{
    name: string;
    addresses: Array<{
      address: string;
      netmask: string;
      broadcast: string;
    }>;
  }>;
}

interface SystemInfo {
  platform: string;
  machine: string;
  processor: string;
  hostname: string;
  python_version: string;
  boot_time: string;
  uptime_seconds: number;
  uptime_formatted: string;
}

interface GPUInfo {
  temperature: number;
  memory: number;
}

interface ProcessInfo {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
}

interface FullMetrics {
  timestamp: number;
  cpu: CPUInfo;
  memory: MemoryInfo;
  disk: DiskInfo;
  network: NetworkInfo;
  system: SystemInfo;
  gpu: GPUInfo;
  top_processes: ProcessInfo[];
  _demo?: boolean;
}

export default function EnhancedDashboard() {
  const [metrics, setMetrics] = useState<FullMetrics | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // 格式化字节
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取指标数据
  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics-full');
      const data = await res.json();
      setMetrics(data);
      setLastUpdate(new Date().toLocaleTimeString('zh-CN'));
      setError(null);
    } catch (e) {
      console.error('Failed to fetch metrics');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-4 md:p-8">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* 头部 */}
        <header className="mb-8">
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                  树莓派监控中心
                </h1>
                <p className="text-slate-400 text-sm">
                  {metrics?.system.hostname || 'Raspberry Pi'} • {metrics?.system.machine || 'ARM'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500">运行时间</p>
                  <p className="text-sm font-mono text-slate-300">{metrics?.system.uptime_formatted || '--'}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{lastUpdate}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 核心指标网格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={Thermometer}
            label="CPU 温度"
            value={metrics?.cpu.temperature}
            unit="°C"
            color="orange"
            subValue={`${metrics?.cpu.frequency || 0} MHz`}
          />
          <MetricCard
            icon={Cpu}
            label="CPU 负载"
            value={metrics?.cpu.usage}
            unit="%"
            color="blue"
            subValue={`${metrics?.cpu.cores || 0} 核心`}
          />
          <MetricCard
            icon={MemoryStick}
            label="内存占用"
            value={metrics?.memory.percent}
            unit="%"
            color="purple"
            subValue={`${metrics?.memory.used || 0}/${metrics?.memory.total || 0} GB`}
          />
          <MetricCard
            icon={Disc}
            label="磁盘空间"
            value={metrics?.disk.percent}
            unit="%"
            color="emerald"
            subValue={`${metrics?.disk.used || 0}/${metrics?.disk.total || 0} GB`}
          />
        </div>

        {/* 详细信息面板 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* CPU 详情 */}
          <ExpandablePanel 
            title="CPU 详情" 
            icon={Cpu}
            isExpanded={expandedSection === 'cpu'}
            onToggle={() => setExpandedSection(expandedSection === 'cpu' ? null : 'cpu')}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-slate-400 text-xs">1分钟负载</p>
                  <p className="text-lg font-mono">{metrics?.cpu.load_avg[0] || 0}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-slate-400 text-xs">5分钟负载</p>
                  <p className="text-lg font-mono">{metrics?.cpu.load_avg[1] || 0}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-slate-400 text-xs">15分钟负载</p>
                  <p className="text-lg font-mono">{metrics?.cpu.load_avg[2] || 0}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">各核心使用率</p>
                <div className="flex gap-1">
                  {metrics?.cpu.per_core.map((usage, i) => (
                    <div key={i} className="flex-1">
                      <div className="text-xs text-center text-slate-500 mb-1">{i}</div>
                      <div className="h-16 bg-slate-800/50 rounded-lg relative overflow-hidden">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-blue-500/60 transition-all duration-500"
                          style={{ height: `${usage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-center text-slate-400 mt-1">{usage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ExpandablePanel>

          {/* 内存详情 */}
          <ExpandablePanel 
            title="内存详情" 
            icon={MemoryStick}
            isExpanded={expandedSection === 'memory'}
            onToggle={() => setExpandedSection(expandedSection === 'memory' ? null : 'memory')}
          >
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">物理内存</span>
                  <span className="font-mono">{metrics?.memory.used} / {metrics?.memory.total} GB</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${metrics?.memory.percent}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">交换空间</span>
                  <span className="font-mono">{metrics?.memory.swap_used} / {metrics?.memory.swap_total} GB</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-400/60 transition-all duration-500"
                    style={{ width: `${metrics?.memory.swap_percent}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">可用内存</p>
                  <p className="text-xl font-mono text-white">{metrics?.memory.available} GB</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">GPU 内存</p>
                  <p className="text-xl font-mono text-white">{metrics?.gpu.memory} MB</p>
                </div>
              </div>
            </div>
          </ExpandablePanel>

          {/* 网络详情 */}
          <ExpandablePanel 
            title="网络详情" 
            icon={Wifi}
            isExpanded={expandedSection === 'network'}
            onToggle={() => setExpandedSection(expandedSection === 'network' ? null : 'network')}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">上传</p>
                  <p className="text-lg font-mono">{formatBytes(metrics?.network.bytes_sent || 0)}</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">下载</p>
                  <p className="text-lg font-mono">{formatBytes(metrics?.network.bytes_recv || 0)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">网络接口</p>
                {metrics?.network.interfaces.map((iface, i) => (
                  <div key={i} className="bg-slate-800/30 rounded-lg p-3 mb-2">
                    <p className="text-sm font-medium text-white mb-1">{iface.name}</p>
                    {iface.addresses.map((addr, j) => (
                      <p key={j} className="text-xs text-slate-400 font-mono">{addr.address}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </ExpandablePanel>

          {/* 系统信息 */}
          <ExpandablePanel 
            title="系统信息" 
            icon={Server}
            isExpanded={expandedSection === 'system'}
            onToggle={() => setExpandedSection(expandedSection === 'system' ? null : 'system')}
          >
            <div className="space-y-2 text-sm">
              <InfoRow label="主机名" value={metrics?.system.hostname} />
              <InfoRow label="平台" value={metrics?.system.platform} />
              <InfoRow label="架构" value={metrics?.system.machine} />
              <InfoRow label="处理器" value={metrics?.system.processor} />
              <InfoRow label="Python 版本" value={metrics?.system.python_version} />
              <InfoRow label="启动时间" value={new Date(metrics?.system.boot_time || 0).toLocaleString('zh-CN')} />
              <InfoRow label="GPU 温度" value={`${metrics?.gpu.temperature}°C`} />
            </div>
          </ExpandablePanel>
        </div>

        {/* 进程列表 */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-cyan-400" size={20} />
            <h2 className="text-lg font-semibold">热门进程</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2 px-3">PID</th>
                  <th className="text-left py-2 px-3">进程名</th>
                  <th className="text-right py-2 px-3">CPU %</th>
                  <th className="text-right py-2 px-3">内存 %</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.top_processes.map((proc) => (
                  <tr key={proc.pid} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-mono text-slate-400">{proc.pid}</td>
                    <td className="py-2 px-3">{proc.name}</td>
                    <td className="py-2 px-3 text-right font-mono">{proc.cpu_percent}%</td>
                    <td className="py-2 px-3 text-right font-mono">{proc.memory_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 拍摄区域 */}
        <div className="glass rounded-2xl p-6 mb-6">
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

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-300 text-sm">{error}</p>
              <p className="text-slate-400 text-xs mt-1">
                请在树莓派上运行: python3 pi-server/server_enhanced.py
              </p>
            </div>
          )}

          {capturedImage ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <img src={capturedImage} alt="Captured" className="w-full max-h-[400px] object-contain bg-black/50" />
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
            <div className="h-48 flex items-center justify-center bg-black/30 rounded-xl border border-dashed border-white/10">
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
            Raspberry Pi 5 • Python • Flask • Next.js • Vercel
          </p>
          {metrics?._demo && (
            <p className="text-xs text-amber-500/60 mt-1">演示模式 - 连接树莓派获取真实数据</p>
          )}
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
  subValue?: string;
}

function MetricCard({ icon: Icon, label, value, unit, color, subValue }: MetricCardProps) {
  const colorClasses = {
    orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  return (
    <div className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
          <Icon size={16} />
        </div>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white tabular-nums">
          {value ?? '--'}
        </span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
      {subValue && (
        <p className="text-xs text-slate-500 mt-1">{subValue}</p>
      )}
    </div>
  );
}

// 可展开面板组件
interface ExpandablePanelProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

function ExpandablePanel({ title, icon: Icon, children, isExpanded, onToggle }: ExpandablePanelProps) {
  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="text-slate-400" size={20} />
          <h3 className="font-semibold">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-slate-400" size={20} />
        ) : (
          <ChevronDown className="text-slate-400" size={20} />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// 信息行组件
function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-800/50 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200 font-mono truncate max-w-[60%]">{value || '--'}</span>
    </div>
  );
}
