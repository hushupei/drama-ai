#!/bin/bash
# Docker 安装脚本 for macOS

echo "🐳 Docker Desktop 安装脚本"
echo "=========================="

# 检查是否已经安装
if command -v docker &> /dev/null; then
    echo "✅ Docker 已安装: $(docker --version)"
    exit 0
fi

# 检测芯片架构
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    DOWNLOAD_URL="https://desktop.docker.com/mac/main/arm64/Docker.dmg"
    echo "📱 检测到 Apple Silicon (ARM64)"
else
    DOWNLOAD_URL="https://desktop.docker.com/mac/main/amd64/Docker.dmg"
    echo "💻 检测到 Intel Mac (AMD64)"
fi

echo ""
echo "📥 下载 Docker Desktop..."
curl -L "$DOWNLOAD_URL" -o ~/Downloads/Docker.dmg

echo "📦 挂载 DMG..."
hdiutil attach ~/Downloads/Docker.dmg

echo "🚀 安装 Docker Desktop..."
cp -R /Volumes/Docker/Docker.app /Applications/

echo "🔌 卸载 DMG..."
hdiutil detach /Volumes/Docker

echo "🗑️  清理下载文件..."
rm ~/Downloads/Docker.dmg

echo ""
echo "✅ Docker Desktop 安装完成！"
echo ""
echo "⚠️  请手动启动 Docker Desktop:"
echo "   1. 打开 '启动台' 或 'Applications' 文件夹"
echo "   2. 双击 Docker.app 启动"
echo "   3. 等待 Docker 启动完成（顶部菜单栏显示鲸鱼图标）"
echo "   4. 返回此处运行 ./scripts/deploy.sh"
echo ""
echo "⏳ 安装后首次启动可能需要几分钟..."
