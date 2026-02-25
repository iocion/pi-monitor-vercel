import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Cpu, 
  Thermometer, 
  HardDrive, 
  Activity,
  Server,
  Terminal,
  RefreshCw,
  Smartphone,
  Wifi,
  Battery,
  MemoryStick
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface SystemMetrics {
  timestamp: number;
  cpu_temp: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
}

interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
}

// 模拟数据生成器
const generateMockData = (): SystemMetrics[] => {
  const data: SystemMetrics[] = [];
  const now = Date.now();
  for (let i = 20; i >= 0; i--) {
    data.push({
      timestamp: now - i * 5000,
      cpu_temp: 45 + Math.random() * 10,
      cpu_usage: 20 + Math.random() * 30,
      memory_usage: 35 + Math.random() * 20,
      disk_usage: 42 + Math.random() * 5
    });
  }
  return data;
};

const mockProcesses: ProcessInfo[] = [
  { pid: 40619, name: 'python -u monitor.py', cpu: 5.2, memory: 3.1 },
  { pid: 1234, name: 'node', cpu: 3.1, memory: 2.8 },
  { pid: 5678, name: 'next-server', cpu: 2.5, memory: 4.2 },
  { pid: 9012, name: 'sshd', cpu: 0.1, memory: 0.5 },
];

export default function Dashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [uptime, setUptime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 初始化数据
    setMetrics(generateMockData());
    setCurrentMetrics(generateMockData()[20]);

    // 模拟实时更新
    const interval = setInterval(() => {
      setMetrics(prev => {
        const newData = [...prev.slice(1), {
          timestamp: Date.now(),
          cpu_temp: 45 + Math.random() * 10,
          cpu_usage: 20 + Math.random() * 30,
          memory_usage: 35 + Math.random() * 20,
          disk_usage: 42 + Math.random() * 5
        }];
        setCurrentMetrics(newData[newData.length - 1]);
        return newData;
      });
    }, 5000);

    // 计算运行时间
    const startTime = Date.now() - (3 * 60 + 19) * 1000; // 模拟已运行3分19秒
    const uptimeInterval = setInterval(() => {
      const diff = Date.now() - startTime;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setUptime({ days, hours, minutes, seconds });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(uptimeInterval);
    };
  }, []);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  const systemInfo = [
    { icon: Server, label: '版本号', value: 'v2.9.7' },
    { icon: Terminal, label: 'Node.js版本', value: 'v20.20.0' },
    { icon: Clock, label: '服务器时间', value: new Date().toLocaleString('zh-CN') },
    { icon: Smartphone, label: '操作系统', value: 'Linux' },
    { icon: MemoryStick, label: '内存使用', value: '15 MB / 17 MB' },
    { icon: Cpu, label: 'CPU 使用', value: `${currentMetrics?.cpu_usage.toFixed(1) || 0}%` },
    { icon: Activity, label: '运行模式', value: '子进程模式' },
    { icon: Wifi, label: '进程 PID', value: '40619' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部标题栏 */}
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pi Monitor</h1>
                <p className="text-sm text-gray-500">进程监控面板</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">{isOnline ? '在线' : '离线'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 系统概览 - 运行时间卡片 */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">系统概览</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 运行时间卡片 */}
            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {uptime.days}天 {formatTime(uptime.hours)}小时 {formatTime(uptime.minutes)}分 {formatTime(uptime.seconds)}秒
                  </div>
                  <p className="text-sm text-gray-500 mt-1">运行时间</p>
                </div>
              </div>
            </div>

            {/* 状态卡片 */}
            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-primary" />
                  <span className="font-medium text-gray-900">网络状态</span>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">已连接</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">接口</span>
                  <span className="text-gray-900">eth0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IP 地址</span>
                  <span className="text-gray-900">192.168.1.100</span>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-900">快速操作</span>
              </div>
              <div className="space-y-2">
                <button className="w-full py-2 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                  重启监控
                </button>
                <button className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  查看日志
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 系统信息网格 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">系统信息</h2>
            <button className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark">
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
          </div>
          
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
              {systemInfo.map((item, index) => (
                <div key={index} className="p-4 flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 实时监控图表 */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">实时监控</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CPU 温度图表 */}
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-gray-900">CPU 温度</span>
                <span className="ml-auto text-2xl font-bold text-orange-500">
                  {currentMetrics?.cpu_temp.toFixed(1) || 0}°C
                </span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      stroke="#94a3b8"
                      fontSize={10}
                    />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString('zh-CN')}
                      formatter={(value: number) => [`${value.toFixed(1)}°C`, '温度']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cpu_temp" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#tempGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CPU 使用率图表 */}
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900">CPU 使用率</span>
                <span className="ml-auto text-2xl font-bold text-blue-500">
                  {currentMetrics?.cpu_usage.toFixed(1) || 0}%
                </span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      stroke="#94a3b8"
                      fontSize={10}
                    />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString('zh-CN')}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '使用率']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cpu_usage" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#cpuGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 内存使用率图表 */}
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MemoryStick className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-gray-900">内存使用率</span>
                <span className="ml-auto text-2xl font-bold text-purple-500">
                  {currentMetrics?.memory_usage.toFixed(1) || 0}%
                </span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      stroke="#94a3b8"
                      fontSize={10}
                    />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString('zh-CN')}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '使用率']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="memory_usage" 
                      stroke="#a855f7" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#memGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 磁盘使用率图表 */}
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <HardDrive className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-900">磁盘使用率</span>
                <span className="ml-auto text-2xl font-bold text-green-500">
                  {currentMetrics?.disk_usage.toFixed(1) || 0}%
                </span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="diskGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      stroke="#94a3b8"
                      fontSize={10}
                    />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString('zh-CN')}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '使用率']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="disk_usage" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#diskGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* 进程列表 */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">进程列表</h2>
          
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">PID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">名称</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">CPU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">内存</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockProcesses.map((process) => (
                    <tr key={process.pid} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">{process.pid}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{process.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{process.cpu}%</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{process.memory}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* 底部信息 */}
      <footer className="bg-surface border-t border-border mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            Raspberry Pi Monitor • Powered by Next.js • Vercel Deploy
          </p>
        </div>
      </footer>
    </div>
  );
}