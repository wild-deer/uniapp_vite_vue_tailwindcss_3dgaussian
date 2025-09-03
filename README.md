# uniapp_vite_vue_tailwindcss_3dgaussian

基于 UniApp + Vite + Vue3 + TailwindCSS 的3D高斯泼溅场景展示应用

## 📋 项目简介

这是一个现代化的3D场景展示应用，使用最新的高斯泼溅（Gaussian Splatting）技术来渲染高质量的3D场景。项目支持多种3D模型格式，包括高斯泼溅点云、GLTF/GLB、OBJ、FBX等，并提供丰富的交互功能和完美的内存管理。

## 🚀 技术栈

- **框架**: UniApp 3.0 + Vue 3.4
- **构建工具**: Vite 5.2
- **样式**: TailwindCSS 4.1
- **3D渲染**: Three.js + Gaussian Splats 3D
- **开发语言**: JavaScript/TypeScript
- **平台支持**: H5、微信小程序、App等

## 📦 主要依赖

- `@mkkellogg/gaussian-splats-3d`: 高斯泼溅3D渲染库
- `three`: 3D图形渲染引擎
- `@dcloudio/uni-app`: UniApp框架
- `tailwindcss`: 原子化CSS框架
- `vue-i18n`: 国际化支持

## 🛠️ 环境要求

- Node.js >= 16.0
- npm >= 8.0 或 yarn >= 1.22
- 现代浏览器（支持WebGL 2.0）

## 📥 安装和运行

### 1. 克隆项目

```bash
git clone https://github.com/wild-deer/uniapp_vite_vue_tailwindcss_3dgaussian.git
cd uniapp_vite_vue_tailwindcss_3dgaussian
```

### 2. 安装依赖

```bash
npm install
# 或
yarn install
```

### 3. 开发环境运行

#### H5平台（推荐）
```bash
npm run dev:h5
# 或
yarn dev:h5
```

#### 微信小程序
```bash
npm run dev:mp-weixin
# 或
yarn dev:mp-weixin
```

#### 其他平台
```bash
# 支付宝小程序
npm run dev:mp-alipay

# 百度小程序
npm run dev:mp-baidu

# App
npm run dev:app
```

### 4. 生产环境构建

```bash
# H5平台
npm run build:h5

# 微信小程序
npm run build:mp-weixin

# 其他平台类似
```

## 🌐 访问地址

开发环境启动后，可以通过以下地址访问：

- **H5**: `https://localhost:5173`
- **微信小程序**: 使用微信开发者工具打开 `dist/dev/mp-weixin` 目录

## 📱 页面功能说明

### 1. 首页 (`pages/index/index.vue`)

**功能特性:**
- 🎨 现代化渐变背景设计
- 📋 场景卡片网格布局展示
- 🏷️ 场景分类标签（室内/室外、大小、质量等）
- 🔄 响应式设计，适配不同屏幕尺寸
- 🧹 开发环境内存监控提示

**场景类型:**
- **人物模型**: 使用Spectacular Rec训练的人物点云
- **室内场景**: 办公室、仓库等室内环境
- **室外场景**: 停车场、内蒙古公路等室外环境
- **复合场景**: 多场景组合展示
- **艺术展示**: 展览空间、图书馆等

### 2. 3D场景页面 (`pages/scene/scene.vue`)

**核心功能:**
- 🎮 **交互控制**: 鼠标拖拽旋转、右键平移、滚轮缩放
- ⌨️ **键盘快捷键**: 
  - `I` - 显示调试信息
  - `C` - 切换网格光标
  - `U` - 切换控制方向标记
  - `←/→` - 相机旋转
  - `P` - 切换点云模式
  - `O` - 切换正交模式
  - `+/-` - 泼溅缩放调节

**场景组件:**
- 🎯 **广告牌系统**: 支持自定义文字、位置、颜色、大小
- 🎲 **3D模型加载**: 支持GLTF/GLB、OBJ、FBX格式
- 🌟 **高斯泼溅渲染**: 高质量点云渲染
- 📷 **自定义相机**: 支持位置、朝向、视角配置

**内存管理:**
- 🧹 **完美清理**: 自动清理WebGL资源、纹理、几何体
- 📊 **内存监控**: 开发环境实时内存使用监控
- 🔄 **资源回收**: 页面切换时自动执行垃圾回收

## 🔧 开发特性

### 内存管理
项目集成了完善的内存管理系统，确保3D场景资源得到正确释放：

```javascript
// 自动内存清理
import { performQuickCleanup } from '@/utils/memoryManager'

// 手动清理
performQuickCleanup()
```

### 场景配置
支持灵活的场景配置，包括多个组件组合：

```javascript
const sceneConfig = {
  billboards: [
    {
      text: '场景标题',
      position: [0, 5, 0],
      scale: [8, 2, 1],
      textColor: '#ffffff',
      strokeColor: '#000000'
    }
  ],
  models3D: [
    {
      url: '/model.glb',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    }
  ],
  gaussianSplats: [
    {
      url: '/scene.splat',
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1]
    }
  ],
  camera: {
    position: [-1, -4, 6],
    up: [0, -1, 0],
    lookAt: [0, 4, 0]
  }
}
```

### 代理配置
项目配置了文件服务器代理，支持远程3D模型加载：

```javascript
// vite.config.js 中的代理配置
proxy: {
  '/fileserver': {
    target: 'https://192.168.1.68:8443/download',
    changeOrigin: true,
    secure: false
  },
  '/backend': {
    target: 'https://jeremy233-temp.oss-cn-guangzhou.aliyuncs.com',
    changeOrigin: true,
    secure: false
  }
}
```

## 🎯 使用指南

### 添加新场景
1. 在 `pages/index/index.vue` 的 `scenes` 数组中添加新场景配置
2. 配置场景的标题、描述、图标等信息
3. 设置 `sceneConfig` 包含所需的3D组件
4. 确保3D模型文件路径正确

### 自定义广告牌
```javascript
{
  text: '自定义文字',
  position: [x, y, z],      // 3D空间位置
  scale: [width, height, 1], // 尺寸
  textColor: '#ffffff',      // 文字颜色
  strokeColor: '#000000',    // 描边颜色
  fontSize: 48               // 字体大小
}
```

### 相机控制
```javascript
camera: {
  position: [x, y, z],    // 相机位置
  up: [0, 1, 0],          // 上方向
  lookAt: [x, y, z]        // 观察点
}
```

## 🐛 常见问题

### Q: 3D模型加载失败？
A: 检查文件路径是否正确，确保文件格式支持（GLTF/GLB、OBJ、FBX）

### Q: 高斯泼溅渲染缓慢？
A: 大文件建议启用渐进式加载，或使用压缩后的模型文件

### Q: 内存占用过高？
A: 项目已集成自动内存清理，页面切换时会自动释放资源

### Q: 小程序平台不支持？
A: 高斯泼溅渲染仅支持H5平台，小程序平台会显示提示信息

