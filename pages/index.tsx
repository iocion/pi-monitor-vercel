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
  MemoryStick,
  AlertCircle
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

interface SystemData {
  timestamp: number;
  cpu: {
    usage: number;
    cores: number;
    frequency: number;
    temperature: number;
    per_core: number[];
    load_avg: number[];
  };
  memory: {
    total: number;
    available: number;
    used: number;
    percent: number;
    swap_total: number;
    swap_used: number;
    swap_percent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  network: {
    bytes_sent: number;
    bytes_recv: number;
    interfaces: { name: string; addresses: any[] }[];
  };
  system: {
    platform: string;
    machine: string;
    processor: string;
    hostname: string;
    python_version: string;
    boot_time: string;
    uptime_seconds: number;
    uptime_formatted: string;
  };
  gpu?: {
    temperature: number;
    memory: number;
  };
  top_processes: { pid: number; name: string; cpu_percent: number; memory_percent: number }[];
  _demo?: boolean;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [uptime, setUptime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bootTime, setBootTime] = useState<Date | null>(null);

  // API 地址 - 使用 Upstash Redis REST API
  const UPSTASH_REDIS_REST_URL = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL || 'https://good-cattle-9550.upstash.io';
  const UPSTASH_REDIS_REST_TOKEN = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN || 'ASVOAAImcDE0YTBlOTI5ZDQ0MDQ0NGFkOTYxYjlhMzdmODAyMmI1ZnAxOTU1MA';
  
  // 获取系统数据的函数
  const fetchSystemData = async () => {
    try {
      // 从 Upstash Redis 读取数据
      const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/pi:metrics`, {
        headers: {
          'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Redis');
      }
      
      const result = await response.json();
      
      if (!result.result) {
        throw new Error('No data in Redis');
      }
      
      // Redis 返回的是字符串，需要解析
      const data: SystemData = JSON.parse(result.result);
      setSystemData(data);
      setIsOnline(true);
      setError(null);
      
      // 设置启动时间
      if (data.system?.boot_time) {
        setBootTime(new Date(data.system.boot_time));
      }
      
      // 转换数据格式用于图表
      const newMetric: SystemMetrics = {
        timestamp: Date.now(),
        cpu_temp: data.cpu?.temperature || 45,
        cpu_usage: data.cpu?.usage || 20,
        memory_usage: data.memory?.percent || 35,
        disk_usage: data.disk?.percent || 42
      };
      
      setMetrics(prev => {
        const newData = [...prev.slice(-19), newMetric];
        return newData;
      });
      setCurrentMetrics(newMetric);
      setIsLoading(false);
      
      return data;
    } catch (err) {
      setError('无法连接到监控服务 (Redis)');
      setIsOnline(false);
      setIsLoading(false);
      return null;
    }
  };

  useEffect(() => {
    // 初始加载
    fetchSystemData();
    
    // 每5秒更新一次数据
    const dataInterval = setInterval(fetchSystemData, 5000);
    
    return () => {
      clearInterval(dataInterval);
    };
  }, []);

  // 计算运行时间
  useEffect(() => {
    if (!bootTime) return;
    
    const updateUptime = () => {
      const diff = Date.now() - bootTime.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setUptime({ days, hours, minutes, seconds });
    };
    
    updateUptime();
    const uptimeInterval = setInterval(updateUptime, 1000);
    
    return () => clearInterval(uptimeInterval);
  }, [bootTime]);

  const formatTime = (value: number) => value.toString().padStart(2, '0');
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const systemInfo = systemData ? [
    { icon: Server, label: '主机名', value: systemData.system?.hostname || 'raspberrypi' },
    { icon: Terminal, label: 'Python版本', value: systemData.system?.python_version || '3.11.2' },
    { icon: Clock, label: '启动时间', value: bootTime ? bootTime.toLocaleString('zh-CN') : '-' },
    { icon: Smartphone, label: '操作系统', value: 'Linux' },
    { icon: MemoryStick, label: '内存', value: `${systemData.memory?.used?.toFixed(1) || 0} / ${systemData.memory?.total?.toFixed(1) || 0} GB` },
    { icon: Cpu, label: 'CPU 使用', value: `${systemData.cpu?.usage?.toFixed(1) || 0}%` },
    { icon: Activity, label: 'CPU核心', value: `${systemData.cpu?.cores || 4}核 @ ${systemData.cpu?.frequency || 2400}MHz` },
    { icon: Wifi, label: '进程数', value: systemData.top_processes?.length?.toString() || '-' },
  ] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在加载监控数据...</p>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-3">
              {systemData?._demo && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                  演示模式
                </span>
              )}
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">{isOnline ? '在线' : '离线'}</span>
              <button 
                onClick={fetchSystemData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

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
                    {uptime.days}天 {formatTime(uptime.hours)}:{formatTime(uptime.minutes)}:{formatTime(uptime.seconds)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">运行时间</p>
                  {systemData?.system?.uptime_formatted && (
                    <p className="text-xs text-gray-400 mt-1">系统报告: {systemData.system.uptime_formatted}</p>
                  )}
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
                <span className={`px-2 py-1 text-xs rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isOnline ? '已连接' : '断开'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">接口</span>
                  <span className="text-gray-900">{systemData?.network?.interfaces?.[0]?.name || 'wlan0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IP 地址</span>
                  <span className="text-gray-900">{systemData?.network?.interfaces?.[0]?.addresses?.[0]?.address || '192.168.1.100'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">接收/发送</span>
                  <span className="text-gray-900">{formatBytes(systemData?.network?.bytes_recv || 0)} / {formatBytes(systemData?.network?.bytes_sent || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 系统信息网格 */}
        {systemData && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">系统信息</h2>
              <span className="text-xs text-gray-500">
                最后更新: {new Date(systemData.timestamp).toLocaleTimeString('zh-CN')}
              </span>
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
        )}

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
                  {currentMetrics?.cpu_temp.toFixed(1) || systemData?.cpu?.temperature?.toFixed(1) || 0}°C
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
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[30, 70]} />
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
                  {currentMetrics?.cpu_usage.toFixed(1) || systemData?.cpu?.usage?.toFixed(1) || 0}%
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
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
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
                  {currentMetrics?.memory_usage.toFixed(1) || systemData?.memory?.percent?.toFixed(1) || 0}%
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
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
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
                  {currentMetrics?.disk_usage.toFixed(1) || systemData?.disk?.percent?.toFixed(1) || 0}%
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
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
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
                  {(systemData?.top_processes || []).map((process) => (
                    <tr key={process.pid} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">{process.pid}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{process.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{process.cpu_percent.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{process.memory_percent.toFixed(1)}%</td>
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