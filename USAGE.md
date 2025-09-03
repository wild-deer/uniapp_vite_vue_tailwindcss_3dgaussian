# 使用说明文档

## 📖 详细使用指南

### 🚀 快速开始

#### 1. 环境准备
确保您的开发环境满足以下要求：
- Node.js 16.0 或更高版本
- npm 8.0 或 yarn 1.22 或更高版本
- 现代浏览器（Chrome 80+、Firefox 75+、Safari 13+）

#### 2. 项目启动
```bash
# 安装依赖
npm install

# 启动H5开发服务器
npm run dev:h5
```

#### 3. 访问应用
打开浏览器访问 `https://localhost:5173`

### 🎮 操作指南

#### 3D场景交互操作

**鼠标操作：**
- **左键点击**: 设置相机焦点
- **左键拖拽**: 围绕焦点旋转视角
- **右键拖拽**: 平移视角
- **滚轮**: 缩放视角

**键盘快捷键：**
- `I` - 显示/隐藏调试信息面板
- `C` - 切换网格光标显示
- `U` - 切换控制方向标记
- `←` - 逆时针旋转相机
- `→` - 顺时针旋转相机
- `P` - 切换点云渲染模式
- `O` - 切换正交投影模式
- `+` - 增加泼溅缩放
- `-` - 减少泼溅缩放

#### 场景浏览
1. 在首页选择想要查看的场景
2. 点击场景卡片进入3D场景页面
3. 使用鼠标和键盘进行交互操作
4. 点击"返回"按钮回到首页

### 🔧 开发配置

#### 项目结构
```
uniapp_vite_vue_tailwindcss_3dgaussian/
├── src/
│   ├── pages/
│   │   ├── index/          # 首页
│   │   └── scene/          # 3D场景页
│   ├── utils/
│   │   └── memoryManager.js # 内存管理工具
│   ├── App.vue             # 应用入口
│   ├── main.js             # 主入口文件
│   ├── pages.json          # 页面配置
│   └── manifest.json       # 应用配置
├── vite.config.js          # Vite配置
├── package.json            # 依赖配置
└── README.md              # 项目说明
```

#### 配置文件说明

**vite.config.js 关键配置：**
```javascript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: true, // 启用HTTPS（WebGL要求）
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    proxy: {
      '/fileserver': {
        target: 'https://192.168.1.68:8443/download',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

**pages.json 页面配置：**
```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "3D高斯场景展示",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/scene/scene",
      "style": {
        "navigationBarTitleText": "3D场景浏览",
        "navigationStyle": "custom"
      }
    }
  ]
}
```

### 🎨 自定义场景

#### 添加新场景
在 `src/pages/index/index.vue` 中的 `scenes` 数组添加新场景：

```javascript
{
  title: '新场景名称',
  description: '场景描述',
  icon: '🏠',
  type: '室内场景',
  size: '中型',
  quality: '高质量',
  status: '可用',
  sceneConfig: {
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
        url: '/path/to/model.glb',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      }
    ],
    gaussianSplats: [
      {
        url: '/path/to/scene.splat',
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
}
```

#### 场景组件配置

**广告牌配置：**
```javascript
{
  text: '显示文字',
  position: [x, y, z],        // 3D空间坐标
  scale: [width, height, 1],   // 尺寸
  textColor: '#ffffff',        // 文字颜色
  strokeColor: '#000000',      // 描边颜色
  fontSize: 48                 // 字体大小
}
```

**3D模型配置：**
```javascript
{
  url: '/model.glb',           // 模型文件路径
  position: [x, y, z],         // 位置
  rotation: [x, y, z],         // 旋转（欧拉角）
  scale: [x, y, z]            // 缩放
}
```

**高斯泼溅配置：**
```javascript
{
  url: '/scene.splat',         // 点云文件路径
  position: [x, y, z],         // 位置
  rotation: [x, y, z, w],      // 旋转（四元数）
  scale: [x, y, z]            // 缩放
}
```

**相机配置：**
```javascript
{
  position: [x, y, z],         // 相机位置
  up: [x, y, z],              // 上方向向量
  lookAt: [x, y, z]           // 观察目标点
}
```

### 🧹 内存管理

#### 自动内存清理
项目集成了完善的内存管理系统，在以下情况会自动清理资源：
- 页面切换时
- 组件卸载时
- 手动调用清理函数时

#### 手动内存清理
```javascript
import { performQuickCleanup } from '@/utils/memoryManager'

// 执行完整清理
performQuickCleanup()

// 查看内存使用情况
import { logMemoryUsage } from '@/utils/memoryManager'
logMemoryUsage('当前状态')

// 检查清理状态
import { checkCleanupStatus } from '@/utils/memoryManager'
checkCleanupStatus()
```

#### 开发环境调试
在开发环境中，可以使用以下全局函数进行调试：
```javascript
// 查看内存使用
window.debugMemory()

// 检查清理状态
window.checkCleanup()

// 强制清理
window.forceCleanup()
```

### 🚀 部署指南

#### H5平台部署
```bash
# 构建生产版本
npm run build:h5

# 部署到服务器
# 将 dist/build/h5 目录下的文件上传到Web服务器
```

#### 微信小程序部署
```bash
# 构建小程序版本
npm run build:mp-weixin

# 使用微信开发者工具打开 dist/build/mp-weixin 目录
# 上传代码到微信小程序后台
```

#### 服务器配置要求
- 支持HTTPS（WebGL要求）
- 配置正确的CORS头
- 支持大文件上传和下载
- 配置适当的缓存策略

### 🔍 故障排除

#### 常见问题及解决方案

**1. 3D模型无法加载**
- 检查文件路径是否正确
- 确认文件格式支持（GLTF/GLB、OBJ、FBX）
- 检查网络连接和代理配置

**2. 高斯泼溅渲染缓慢**
- 使用压缩后的模型文件
- 启用渐进式加载
- 检查设备性能

**3. 内存占用过高**
- 确保页面切换时执行清理
- 检查是否有内存泄漏
- 使用开发工具监控内存使用

**4. 浏览器兼容性问题**
- 确保浏览器支持WebGL 2.0
- 更新浏览器到最新版本
- 检查浏览器设置是否阻止了WebGL

**5. HTTPS证书问题**
- 开发环境可以使用自签名证书
- 生产环境需要有效的SSL证书
- 配置正确的安全头

#### 性能优化建议

**1. 模型优化**
- 使用压缩的3D模型文件
- 减少模型的多边形数量
- 优化纹理大小

**2. 加载优化**
- 启用渐进式加载
- 使用CDN加速文件下载
- 实现懒加载机制

**3. 渲染优化**
- 调整渲染质量设置
- 使用适当的LOD（细节层次）
- 优化相机视角

### 📊 监控和分析

#### 性能监控
项目集成了性能监控功能，可以监控：
- 内存使用情况
- 渲染帧率
- 加载时间
- 资源使用情况

#### 调试工具
- 浏览器开发者工具
- Three.js Inspector
- 内存分析工具
- 网络监控工具

### 🔐 安全考虑

#### 文件安全
- 验证上传的文件格式
- 限制文件大小
- 扫描恶意文件

#### 网络安全
- 使用HTTPS传输
- 配置正确的CORS策略
- 实施访问控制

#### 数据安全
- 保护用户隐私数据
- 加密敏感信息
- 定期备份数据

### 📈 扩展功能

#### 可能的扩展方向
1. **VR/AR支持**: 集成WebXR API
2. **多人协作**: 实时同步3D场景
3. **AI集成**: 智能场景分析
4. **云端渲染**: 服务器端渲染支持
5. **移动优化**: 更好的移动端体验

#### 插件开发
项目支持插件化开发，可以开发：
- 自定义渲染器
- 特效插件
- 交互插件
- 数据可视化插件

---

**注意**: 本使用说明会随着项目更新而更新，请定期查看最新版本。
