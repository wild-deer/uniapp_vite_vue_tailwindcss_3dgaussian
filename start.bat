@echo off
chcp 65001 >nul
title 3D高斯场景项目快速启动脚本

echo 🚀 3D高斯场景项目快速启动脚本
echo ==================================

REM 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到Node.js，请先安装Node.js 16.0或更高版本
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查npm是否安装
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到npm，请先安装npm
    pause
    exit /b 1
)

REM 显示版本信息
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ Node.js版本: %NODE_VERSION%
echo ✅ npm版本: %NPM_VERSION%

REM 检查是否在项目目录
if not exist "package.json" (
    echo ❌ 错误: 请在项目根目录下运行此脚本
    pause
    exit /b 1
)

REM 检查依赖是否已安装
if not exist "node_modules" (
    echo 📦 正在安装项目依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败，请检查网络连接或尝试使用yarn
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已安装
)

REM 检查SSL证书
if not exist "key.pem" (
    echo 🔐 正在生成SSL证书...
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost" >nul 2>nul
    if %errorlevel% neq 0 (
        echo ⚠️  SSL证书生成失败，将使用HTTP模式
        echo    注意: 某些3D功能可能需要HTTPS
    ) else (
        echo ✅ SSL证书生成完成
    )
) else (
    echo ✅ SSL证书已存在
)

REM 选择启动模式
echo.
echo 请选择启动模式:
echo 1) H5开发模式 (推荐)
echo 2) 微信小程序开发模式
echo 3) 支付宝小程序开发模式
echo 4) 百度小程序开发模式
echo 5) App开发模式
echo 6) 自定义平台
echo.

set /p choice="请输入选择 (1-6): "

if "%choice%"=="1" (
    echo 🌐 启动H5开发模式...
    npm run dev:h5
) else if "%choice%"=="2" (
    echo 📱 启动微信小程序开发模式...
    npm run dev:mp-weixin
) else if "%choice%"=="3" (
    echo 📱 启动支付宝小程序开发模式...
    npm run dev:mp-alipay
) else if "%choice%"=="4" (
    echo 📱 启动百度小程序开发模式...
    npm run dev:mp-baidu
) else if "%choice%"=="5" (
    echo 📱 启动App开发模式...
    npm run dev:app
) else if "%choice%"=="6" (
    set /p platform="请输入平台参数 (如: mp-qq): "
    echo 🚀 启动自定义平台开发模式: %platform%
    npm run dev:custom -- -p %platform%
) else (
    echo ❌ 无效选择，默认启动H5模式
    npm run dev:h5
)

echo.
echo 🎉 项目启动完成!
echo 📖 详细使用说明请查看 README.md 和 USAGE.md
echo 🌐 H5访问地址: https://localhost:5173
echo 🔧 开发工具: 按 Ctrl+C 停止服务
pause
