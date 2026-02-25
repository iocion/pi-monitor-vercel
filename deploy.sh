#!/bin/bash

# Pi Monitor Dashboard 部署脚本

echo "🚀 Pi Monitor Dashboard 部署工具"
echo "================================"
echo ""

# 检查 git 是否配置
if ! git config --global user.email > /dev/null 2>&1; then
    echo "⚠️  请先配置 Git 用户信息:"
    echo "   git config --global user.email 'your@email.com'"
    echo "   git config --global user.name 'Your Name'"
    exit 1
fi

# 检查是否有 GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  需要 GitHub Personal Access Token"
    echo "   1. 访问 https://github.com/settings/tokens"
    echo "   2. 生成新的 token (选择 'repo' 权限)"
    echo "   3. 设置环境变量: export GITHUB_TOKEN=your_token"
    echo ""
    echo "   或者手动推送:"
    echo "   git push https://USERNAME:TOKEN@github.com/iocion/pi-monitor-dashboard.git main"
    exit 1
fi

# 推送到 GitHub
echo "📤 推送到 GitHub..."
git remote remove origin 2>/dev/null
git remote add origin "https://${GITHUB_TOKEN}@github.com/iocion/pi-monitor-dashboard.git"
git branch -M main
git push -u origin main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功!"
    echo ""
    echo "🌐 下一步: Vercel 部署"
    echo "   1. 访问 https://vercel.com/new"
    echo "   2. 导入 iocion/pi-monitor-dashboard 仓库"
    echo "   3. 框架选择 'Next.js'"
    echo "   4. 点击 'Deploy'"
    echo ""
    echo "📱 部署完成后，访问 https://pi-monitor-dashboard.vercel.app"
else
    echo "❌ 推送失败，请检查 GITHUB_TOKEN"
fi