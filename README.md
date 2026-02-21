# 树莓派监控面板 - 增强版

一个功能丰富的 Raspberry Pi 实时监控面板，支持系统监控、相机拍摄和远程访问。

## ✨ 新增功能

### 1. 增强版服务器 (`pi-server/server_enhanced.py`)
- **CPU 详情**: 核心使用率、频率、温度、负载均衡
- **内存详情**: 物理内存、交换空间使用
- **磁盘详情**: 分区信息、使用率
- **网络详情**: 流量统计、接口信息
- **GPU 信息**: 温度、内存使用
- **进程列表**: 热门进程监控

### 2. 增强版前端 (`frontend/app/page-enhanced.tsx`)
- 可展开的面板查看详细信息
- 实时 CPU 核心使用率图表
- 内存和交换空间可视化
- 网络流量统计
- 进程列表表格
- 系统信息展示

### 3. 数据上报脚本 (`scripts/metrics_reporter.py`)
- 定期上报系统指标到 Upstash Redis
- 支持 Vercel 远程访问

## 🚀 快速开始

### 1. 安装依赖

```bash
# 在树莓派上
pip3 install flask flask-cors psutil requests
```

### 2. 启动增强版服务器

```bash
# 在树莓派上运行
cd pi-monitor-vercel
python3 pi-server/server_enhanced.py
```

服务器将在 `http://0.0.0.0:5000` 启动，提供以下端点：

- `GET /api/metrics` - 获取所有系统指标
- `GET /api/cpu` - CPU 详情
- `GET /api/memory` - 内存详情
- `GET /api/disk` - 磁盘详情
- `GET /api/network` - 网络详情
- `GET /api/processes` - 进程列表
- `POST /capture` - 拍摄照片

### 3. 使用增强版前端

```bash
cd pi-monitor-vercel/frontend
npm install
npm run dev
```

访问 `http://localhost:3000` 查看监控面板。

### 4. 使用原版前端

如果你想使用原版简洁界面：

```bash
# 修改 page.tsx 为原版
# 或者保留 page.tsx 使用简洁版
```

## 📊 监控指标说明

### CPU 监控
- **温度**: CPU 核心温度（树莓派特定传感器）
- **使用率**: 总体 CPU 使用率
- **频率**: 当前运行频率
- **核心**: 每个核心的使用率可视化
- **负载**: 1/5/15分钟平均负载

### 内存监控
- **物理内存**: 总内存、已用、可用、使用率
- **交换空间**: 交换分区使用情况
- **GPU 内存**: 显卡内存分配

### 磁盘监控
- **总容量**: 根分区使用情况
- **分区详情**: 所有挂载点的使用情况

### 网络监控
- **流量统计**: 上传/下载字节数
- **接口信息**: IP 地址、子网掩码

### 进程监控
- **热门进程**: 按 CPU 使用率排序的进程列表

## 🔧 配置

### 环境变量

```bash
# 树莓派本地服务器地址
export LOCAL_PI_API="http://your-pi-ip:5000"

# Upstash Redis（用于远程访问）
export UPSTASH_REDIS_REST_URL="https://your-url.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="your-token"
```

### Vercel 部署

1. Fork 或克隆项目到 GitHub
2. 在 Vercel 导入项目
3. 设置环境变量
4. 部署

## 📝 文件结构

```
pi-monitor-vercel/
├── pi-server/
│   ├── server.py              # 原版服务器
│   └── server_enhanced.py     # 增强版服务器 ⭐
├── frontend/
│   └── app/
│       ├── page.tsx           # 原版前端
│       ├── page-enhanced.tsx  # 增强版前端 ⭐
│       ├── api/
│       │   ├── capture/
│       │   │   └── route.ts
│       │   ├── metrics/
│       │   │   └── route.ts
│       │   └── metrics-full/  # 增强版 API ⭐
│       │       └── route.ts
│       └── globals.css
└── scripts/
    └── metrics_reporter.py    # 数据上报脚本 ⭐
```

## 🎯 使用建议

### 本地使用
- 直接使用增强版服务器和前端
- 实时数据，功能最全

### 远程访问
- 部署前端到 Vercel
- 在树莓派运行 `metrics_reporter.py`
- 查看基础监控数据

## 🔒 安全提示

- 生产环境请设置访问密码
- 使用防火墙限制 5000 端口访问
- 定期更新系统和依赖

## 📄 许可证

MIT

## 🙏 致谢

- Flask - Web 框架
- psutil - 系统监控
- Next.js - 前端框架
- Tailwind CSS - 样式框架
