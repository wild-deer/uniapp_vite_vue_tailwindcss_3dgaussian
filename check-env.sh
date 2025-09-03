#!/bin/bash

# 3D高斯场景项目环境检查脚本
# 检查开发环境是否满足项目要求

echo "🔍 3D高斯场景项目环境检查"
echo "============================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查结果统计
total_checks=0
passed_checks=0
warnings=0

# 检查函数
check_item() {
    local name="$1"
    local condition="$2"
    local message="$3"
    local warning="$4"
    
    total_checks=$((total_checks + 1))
    
    if eval "$condition"; then
        echo -e "${GREEN}✅ $name${NC}"
        passed_checks=$((passed_checks + 1))
    elif [ "$warning" = "true" ]; then
        echo -e "${YELLOW}⚠️  $name - $message${NC}"
        warnings=$((warnings + 1))
    else
        echo -e "${RED}❌ $name - $message${NC}"
    fi
}

echo ""
echo "📋 基础环境检查"
echo "----------------"

# 检查Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    check_item "Node.js" "[ $NODE_MAJOR -ge 16 ]" "版本: $NODE_VERSION" "false"
else
    check_item "Node.js" "false" "未安装" "false"
fi

# 检查npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    NPM_MAJOR=$(echo $NPM_VERSION | cut -d. -f1)
    check_item "npm" "[ $NPM_MAJOR -ge 8 ]" "版本: $NPM_VERSION" "false"
else
    check_item "npm" "false" "未安装" "false"
fi

# 检查yarn（可选）
if command -v yarn &> /dev/null; then
    YARN_VERSION=$(yarn --version)
    check_item "yarn" "true" "版本: $YARN_VERSION" "true"
else
    check_item "yarn" "false" "未安装（可选）" "true"
fi

# 检查Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    check_item "Git" "true" "版本: $GIT_VERSION" "true"
else
    check_item "Git" "false" "未安装（可选）" "true"
fi

echo ""
echo "🌐 网络环境检查"
echo "----------------"

# 检查网络连接
if ping -c 1 8.8.8.8 &> /dev/null; then
    check_item "网络连接" "true" "正常" "false"
else
    check_item "网络连接" "false" "无法连接外网" "false"
fi

# 检查npm镜像
NPM_REGISTRY=$(npm config get registry)
if [[ "$NPM_REGISTRY" == *"registry.npmjs.org"* ]]; then
    check_item "npm镜像" "true" "使用官方镜像" "true"
else
    check_item "npm镜像" "true" "使用镜像: $NPM_REGISTRY" "true"
fi

echo ""
echo "🔧 项目环境检查"
echo "----------------"

# 检查项目目录
if [ -f "package.json" ]; then
    check_item "项目目录" "true" "在项目根目录" "false"
else
    check_item "项目目录" "false" "请在项目根目录运行" "false"
fi

# 检查依赖安装
if [ -d "node_modules" ]; then
    check_item "项目依赖" "true" "已安装" "false"
else
    check_item "项目依赖" "false" "未安装，请运行 npm install" "false"
fi

# 检查SSL证书
if [ -f "key.pem" ] && [ -f "cert.pem" ]; then
    check_item "SSL证书" "true" "已生成" "false"
else
    check_item "SSL证书" "false" "未生成，将自动生成" "true"
fi

# 检查OpenSSL
if command -v openssl &> /dev/null; then
    OPENSSL_VERSION=$(openssl version | cut -d' ' -f2)
    check_item "OpenSSL" "true" "版本: $OPENSSL_VERSION" "false"
else
    check_item "OpenSSL" "false" "未安装，SSL证书生成可能失败" "true"
fi

echo ""
echo "🌍 浏览器环境检查"
echo "------------------"

# 检查是否在浏览器环境
if [ -n "$BROWSER" ]; then
    check_item "浏览器环境" "true" "检测到浏览器" "true"
else
    check_item "浏览器环境" "false" "非浏览器环境" "true"
fi

# 检查WebGL支持（需要浏览器环境）
if command -v node &> /dev/null; then
    # 使用Node.js检查WebGL支持
    NODE_CHECK_SCRIPT="
    const { execSync } = require('child_process');
    try {
        const result = execSync('echo \"WebGL check\"', { encoding: 'utf8' });
        console.log('WebGL支持检查需要浏览器环境');
    } catch (error) {
        console.log('WebGL检查失败');
    }
    "
    echo -e "${BLUE}ℹ️  WebGL支持 - 请在浏览器中检查${NC}"
else
    check_item "WebGL支持" "false" "无法检查" "true"
fi

echo ""
echo "📊 检查结果统计"
echo "----------------"

echo "总检查项: $total_checks"
echo -e "通过检查: ${GREEN}$passed_checks${NC}"
echo -e "警告项: ${YELLOW}$warnings${NC}"
echo -e "失败项: ${RED}$((total_checks - passed_checks - warnings))${NC}"

echo ""
echo "💡 建议和说明"
echo "--------------"

if [ $passed_checks -eq $total_checks ]; then
    echo -e "${GREEN}🎉 环境检查全部通过！可以正常启动项目。${NC}"
elif [ $((total_checks - passed_checks - warnings)) -eq 0 ]; then
    echo -e "${YELLOW}⚠️  环境基本满足要求，但有一些警告项。${NC}"
    echo "建议解决警告项以获得更好的开发体验。"
else
    echo -e "${RED}❌ 环境检查未通过，请解决失败项后重试。${NC}"
fi

echo ""
echo "🔧 快速修复建议:"
echo "1. 安装Node.js 16.0+: https://nodejs.org/"
echo "2. 运行 npm install 安装依赖"
echo "3. 确保网络连接正常"
echo "4. 使用现代浏览器（Chrome、Firefox、Safari）"

echo ""
echo "📖 更多信息请查看:"
echo "- README.md: 项目说明"
echo "- USAGE.md: 详细使用指南"
echo "- 运行 ./start.sh 或 start.bat 快速启动项目"

echo ""
echo "按任意键退出..."
read -n 1
