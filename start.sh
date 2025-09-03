#!/bin/bash

# 3D高斯场景项目快速启动脚本
# 适用于 Windows、macOS 和 Linux

echo "🚀 3D高斯场景项目快速启动脚本"
echo "=================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到Node.js，请先安装Node.js 16.0或更高版本"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未检测到npm，请先安装npm"
    exit 1
fi

# 显示版本信息
echo "✅ Node.js版本: $(node --version)"
echo "✅ npm版本: $(npm --version)"

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录下运行此脚本"
    exit 1
fi

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装项目依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败，请检查网络连接或尝试使用yarn"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

# 检查SSL证书
if [ ! -f "key.pem" ] || [ ! -f "cert.pem" ]; then
    echo "🔐 正在生成SSL证书..."
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"
    if [ $? -ne 0 ]; then
        echo "⚠️  SSL证书生成失败，将使用HTTP模式"
        echo "   注意: 某些3D功能可能需要HTTPS"
    else
        echo "✅ SSL证书生成完成"
    fi
fi

# 选择启动模式
echo ""
echo "请选择启动模式:"
echo "1) H5开发模式 (推荐)"
echo "2) 微信小程序开发模式"
echo "3) 支付宝小程序开发模式"
echo "4) 百度小程序开发模式"
echo "5) App开发模式"
echo "6) 自定义平台"
echo ""

read -p "请输入选择 (1-6): " choice

case $choice in
    1)
        echo "🌐 启动H5开发模式..."
        npm run dev:h5
        ;;
    2)
        echo "📱 启动微信小程序开发模式..."
        npm run dev:mp-weixin
        ;;
    3)
        echo "📱 启动支付宝小程序开发模式..."
        npm run dev:mp-alipay
        ;;
    4)
        echo "📱 启动百度小程序开发模式..."
        npm run dev:mp-baidu
        ;;
    5)
        echo "📱 启动App开发模式..."
        npm run dev:app
        ;;
    6)
        read -p "请输入平台参数 (如: mp-qq): " platform
        echo "🚀 启动自定义平台开发模式: $platform"
        npm run dev:custom -- -p $platform
        ;;
    *)
        echo "❌ 无效选择，默认启动H5模式"
        npm run dev:h5
        ;;
esac

echo ""
echo "🎉 项目启动完成!"
echo "📖 详细使用说明请查看 README.md 和 USAGE.md"
echo "🌐 H5访问地址: https://localhost:5173"
echo "🔧 开发工具: 按 Ctrl+C 停止服务"
