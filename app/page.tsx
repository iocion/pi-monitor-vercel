'use client';

import { useState, useEffect } from 'react';
import { 
  Cpu, MemoryStick, HardDrive, Wifi, Server, Activity,
  ChevronDown, ChevronUp, Disc
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

export default function AppleStyleDashboard() {
  const [metrics, setMetrics] = useState<FullMetrics | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--');
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
    } catch (e) {
      console.error('Failed to fetch metrics');
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center font-sans">
        <div className="text-gray-500 text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* 头部 - Apple 风格 */}
        <header className="mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                  系统监控
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {metrics?.system.hostname || 'Raspberry Pi'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100/80 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-gray-500 font-medium">{lastUpdate}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 核心指标网格 - Apple 风格卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <AppleMetricCard
            icon={Cpu}
            label="CPU"
            value={metrics?.cpu.usage}
            unit="%"
            color="blue"
            subValue={`${metrics?.cpu.temperature || 0}°C`}
          />
          <AppleMetricCard
            icon={MemoryStick}
            label="内存"
            value={metrics?.memory.percent}
            unit="%"
            color="purple"
            subValue={`${metrics?.memory.used || 0}GB`}
          />
          <AppleMetricCard
            icon={Disc}
            label="磁盘"
            value={metrics?.disk.percent}
            unit="%"
            color="orange"
            subValue={`${metrics?.disk.used || 0}GB`}
          />
          <AppleMetricCard
            icon={Wifi}
            label="网络"
            value={metrics?.network.interfaces.length}
            unit="接口"
            color="green"
            subValue="已连接"
          />
        </div>

        {/* 详细信息面板 */}
        <div className="space-y-4 mb-8">
          {/* CPU 详情 */}
          <AppleExpandablePanel 
            title="处理器" 
            icon={Cpu}
            isExpanded={expandedSection === 'cpu'}
            onToggle={() => setExpandedSection(expandedSection === 'cpu' ? null : 'cpu')}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <AppleInfoBox label="1分钟负载" value={metrics?.cpu.load_avg[0] || 0} />
                <AppleInfoBox label="5分钟负载" value={metrics?.cpu.load_avg[1] || 0} />
                <AppleInfoBox label="15分钟负载" value={metrics?.cpu.load_avg[2] || 0} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">核心使用率</p>
                <div className="flex gap-2">
                  {metrics?.cpu.per_core.map((usage, i) => (
                    <div key={i} className="flex-1">
                      <div className="text-[10px] text-center text-gray-400 mb-1">{i}</div>
                      <div className="h-12 bg-gray-100 rounded-lg relative overflow-hidden">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-[#007AFF] transition-all duration-500"
                          style={{ height: `${usage}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-center text-gray-500 mt-1">{usage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AppleExpandablePanel>

          {/* 内存详情 */}
          <AppleExpandablePanel 
            title="内存" 
            icon={MemoryStick}
            isExpanded={expandedSection === 'memory'}
            onToggle={() => setExpandedSection(expandedSection === 'memory' ? null : 'memory')}
          >
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">物理内存</span>
                  <span className="text-gray-900 font-medium">{metrics?.memory.used} / {metrics?.memory.total} GB</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#AF52DE] transition-all duration-500 rounded-full"
                    style={{ width: `${metrics?.memory.percent}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">交换空间</span>
                  <span className="text-gray-900 font-medium">{metrics?.memory.swap_used} / {metrics?.memory.swap_total} GB</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#AF52DE]/60 transition-all duration-500 rounded-full"
                    style={{ width: `${metrics?.memory.swap_percent}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <AppleInfoBox label="可用内存" value={`${metrics?.memory.available} GB`} />
                <AppleInfoBox label="GPU 内存" value={`${metrics?.gpu.memory} MB`} />
              </div>
            </div>
          </AppleExpandablePanel>

          {/* 网络详情 */}
          <AppleExpandablePanel 
            title="网络" 
            icon={Wifi}
            isExpanded={expandedSection === 'network'}
            onToggle={() => setExpandedSection(expandedSection === 'network' ? null : 'network')}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <AppleInfoBox label="上传" value={formatBytes(metrics?.network.bytes_sent || 0)} />
                <AppleInfoBox label="下载" value={formatBytes(metrics?.network.bytes_recv || 0)} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">网络接口</p>
                {metrics?.network.interfaces.map((iface, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 mb-2">
                    <p className="text-sm font-medium text-gray-900">{iface.name}</p>
                    {iface.addresses.map((addr, j) => (
                      <p key={j} className="text-xs text-gray-500 font-mono mt-0.5">{addr.address}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </AppleExpandablePanel>

          {/* 系统信息 */}
          <AppleExpandablePanel 
            title="系统" 
            icon={Server}
            isExpanded={expandedSection === 'system'}
            onToggle={() => setExpandedSection(expandedSection === 'system' ? null : 'system')}
          >
            <div className="space-y-2">
              <AppleInfoRow label="主机名" value={metrics?.system.hostname} />
              <AppleInfoRow label="平台" value={metrics?.system.platform} />
              <AppleInfoRow label="架构" value={metrics?.system.machine} />
              <AppleInfoRow label="处理器" value={metrics?.system.processor} />
              <AppleInfoRow label="Python" value={metrics?.system.python_version} />
              <AppleInfoRow label="运行时间" value={metrics?.system.uptime_formatted} />
            </div>
          </AppleExpandablePanel>
        </div>

        {/* 进程列表 - Apple 风格 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-[#007AFF]" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">进程</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left py-2 px-3 font-medium">PID</th>
                  <th className="text-left py-2 px-3 font-medium">名称</th>
                  <th className="text-right py-2 px-3 font-medium">CPU</th>
                  <th className="text-right py-2 px-3 font-medium">内存</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.top_processes.map((proc) => (
                  <tr key={proc.pid} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-mono text-gray-400 text-xs">{proc.pid}</td>
                    <td className="py-2.5 px-3 text-gray-900">{proc.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600">{proc.cpu_percent}%</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600">{proc.memory_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 底部 */}
        <footer className="text-center pb-8">
          <p className="text-xs text-gray-400">
            Raspberry Pi Monitor
          </p>
          {metrics?._demo && (
            <p className="text-xs text-amber-500/60 mt-1">演示模式</p>
          )}
        </footer>
      </div>
    </div>
  );
}

// Apple 风格指标卡片
interface AppleMetricCardProps {
  icon: React.ElementType;
  label: string;
  value?: number;
  unit: string;
  color: 'blue' | 'purple' | 'orange' | 'green';
  subValue?: string;
}

function AppleMetricCard({ icon: Icon, label, value, unit, color, subValue }: AppleMetricCardProps) {
  const colorClasses = {
    blue: 'bg-[#007AFF]/10 text-[#007AFF]',
    purple: 'bg-[#AF52DE]/10 text-[#AF52DE]',
    orange: 'bg-[#FF9500]/10 text-[#FF9500]',
    green: 'bg-[#34C759]/10 text-[#34C759]',
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
          <Icon size={16} />
        </div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-gray-900 tabular-nums">
          {value ?? '--'}
        </span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      {subValue && (
        <p className="text-xs text-gray-400 mt-1">{subValue}</p>
      )}
    </div>
  );
}

// Apple 风格可展开面板
interface AppleExpandablePanelProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

function AppleExpandablePanel({ title, icon: Icon, children, isExpanded, onToggle }: AppleExpandablePanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="text-gray-400" size={20} />
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-gray-400" size={20} />
        ) : (
          <ChevronDown className="text-gray-400" size={20} />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Apple 风格信息框
function AppleInfoBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

// Apple 风格信息行
function AppleInfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-900 text-sm font-medium truncate max-w-[50%]">{value || '--'}</span>
    </div>
  );
}
