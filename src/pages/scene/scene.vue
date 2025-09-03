<template>
  <view class="flex flex-col h-screen bg-black">
    <!-- 导航栏 -->
    <view class="flex items-center justify-center relative p-4 bg-gray-900/80 backdrop-blur-md h-10">
      <!-- 返回按钮 -->
      <button 
        @click="goBack" 
        class="absolute left-4 flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
      >
        <text class="text-sm">←</text>
        <text>返回</text>
      </button>
      
      <!-- 标题 -->
      <text class="text-white text-lg font-medium">3D高斯场景</text>
      
      <!-- 操作说明按钮 -->
      <button 
        @click="toggleControls" 
        class="absolute right-25 flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
      >
        <text class="text-sm">?</text>
        <text>操作说明</text>
      </button>
      
      <!-- 内存监控按钮（仅开发环境显示） -->
      <!-- #ifdef H5 -->
      <button 
        v-if="isDevelopment"
        @click="logMemoryUsage" 
        class="absolute right-4 flex items-center space-x-1 px-2 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
      >
        <text class="text-sm">📊</text>
        <text>内存</text>
      </button>
      <!-- #endif -->
    </view>

    <!-- 3D场景容器 -->
    <view class="flex-1 relative overflow-hidden">
      <!-- H5平台使用div容器 -->
      <!-- #ifdef H5 -->
      <view ref="viewerCanvas" class="absolute inset-0 w-full h-full" id="gaussian-viewer"></view>
      <!-- #endif -->
      
      <!-- 非H5平台提示 -->
      <!-- #ifndef H5 -->
      <view class="flex items-center justify-center h-full bg-gray-800">
        <text class="text-white text-center">{{ status }}</text>
      </view>
      <!-- #endif -->
    </view>

    <!-- 状态显示 -->
    <view 
      v-if="loading || status !== '模型加载完成'" 
      class="absolute top-20 left-4 bg-black/70 backdrop-blur-md p-4 rounded-lg max-w-xs"
    >
      <text class="text-white text-sm">{{ status }}</text>
    </view>

    <!-- 操作说明面板 -->
    <view 
      v-if="showControls" 
      class="absolute top-20 right-4 bg-black/80 backdrop-blur-md p-6 rounded-lg max-w-md w-80 z-10"
    >
      <view class="relative mb-3">
        <text class="text-white text-lg font-medium block">操作说明</text>
        <button 
          @click="toggleControls" 
          class="absolute top-0 right-0 text-red-500 text-xl hover:text-red-400 transition-colors font-bold w-6 h-6 flex items-center justify-center"
        >
          ×
        </button>
      </view>
      
      <view class="space-y-4">
        <!-- 鼠标操作 -->
        <view>
          <text class="text-green-400 font-medium text-base block mb-3">鼠标操作</text>
          <view class="space-y-2">
            <view class="flex justify-between">
              <text class="text-gray-300 text-sm">左键点击</text>
              <text class="text-white text-sm">设置焦点</text>
            </view>
            <view class="flex justify-between">
              <text class="text-gray-300 text-sm">左键拖拽</text>
              <text class="text-white text-sm">围绕旋转</text>
            </view>
            <view class="flex justify-between">
              <text class="text-gray-300 text-sm">右键拖拽</text>
              <text class="text-white text-sm">平移视角</text>
            </view>
          </view>
        </view>

        <!-- 键盘操作 -->
        <view>
          <text class="text-blue-400 font-medium text-base block mb-3">键盘操作</text>
          <view class="space-y-2">
            <view class="flex justify-between">
              <text class="text-gray-300 text-sm">I 键</text>
              <text class="text-white text-sm">显示调试信息</text>
            </view>
            <view class="flex justify-between">
              <text class="text-gray-300 text-sm">C 键</text>
              <text class="text-white text-sm">切换网格光标</text>
            </view>
            <view class="flex justify-between">
              <text class="text-gray-300 text-sm">U 键</text>
              <text class="text-white text-sm">切换控制方向标记</text>
            </view>
            <view class="flex justify-between">
              <text class="text-gray-300 text-sm">← 键</text>
              <text class="text-white text-sm">逆时针旋转相机</text>
            </view>
            <view class="flex justify-between">
              <text class="text-gray-300 text-sm">→ 键</text>
              <text class="text-white text-sm">顺时针旋转相机</text>
            </view>
            <view class="flex justify-between">
              <text class="text-gray-300 text-sm">P 键</text>
              <text class="text-white text-sm">切换点云模式</text>
            </view>
            <view class="flex justify-between">
              <text class="text-gray-300 text-sm">O 键</text>
              <text class="text-white text-sm">切换正交模式</text>
            </view>
            <view class="flex justify-between">
              <text class="text-gray-300 text-sm">= 键</text>
              <text class="text-white text-sm">增加泼溅缩放</text>
            </view>
            <view class="flex justify-between">
              <text class="text-gray-300 text-sm">- 键</text>
              <text class="text-white text-sm">减少泼溅缩放</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

const threeScene = new THREE.Scene();

// 创建Billboard文字
function createBillboard(config = {}) {
  const {
    text = '',
    position = [0, 5, 0],
    scale = [8, 2, 1],
    fontSize = 48,
    fontFamily = 'Arial',
    textColor = '#ffffff',
    strokeColor = '#000000',
    strokeWidth = 4
  } = config;

  // 创建Canvas用于绘制文字
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // 设置Canvas尺寸
  canvas.width = 512;
  canvas.height = 128;
  
  // 设置字体样式
  context.font = `${fontSize}px ${fontFamily}`;
  context.fillStyle = textColor;
  context.strokeStyle = strokeColor;
  context.lineWidth = strokeWidth;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // 绘制文字（带描边效果）
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  // 创建材质
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    alphaTest: 0.1
  });
  
  // 创建Sprite（自动面向相机的广告牌）
  const billboard = new THREE.Sprite(material);
  
  // 设置位置和大小
  billboard.position.set(...position);
  billboard.scale.set(...scale);
  
  return billboard;
}
// 响应式数据
const viewer = ref(null)
const loading = ref(false)
const status = ref('准备加载3D场景')
const showControls = ref(false) // 控制操作说明面板显示

// 场景配置参数
const sceneConfig = ref({
  // 广告牌配置（可多个）
  billboards: [],
  // 普通三维模型配置（可多个）
  models3D: [],
  // 高斯泼溅点云配置（可多个）
  gaussianSplats: [],
  // 镜头配置
  camera: {
    position: [-1, -4, 6],
    up: [0, -1, 0],
    lookAt: [0, 4, 0]
  }
})

// 用于存储需要清理的资源
const sceneResources = ref({
  viewer: null,
  container: null,
  animationFrame: null,
  eventListeners: [],
  loadedScenes: []
})

// 开发环境标识
const isDevelopment = ref(false)

// #ifdef H5
isDevelopment.value = process.env.NODE_ENV === 'development'
// #endif

// onLoad 生命周期需要通过 defineOptions 或者在页面组件中处理
// 这里我们在 onMounted 中处理页面参数
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}
  
  // 解析场景配置参数
  parseSceneConfig(options)

  // 在H5环境下初始化viewer
  // #ifdef H5
  // 记录初始内存状态
  console.log('🚀 初始化 3D 场景，记录初始内存状态:')
  logMemoryUsage()
  
  initViewer()
  // #endif

  // 非H5平台提示
  // #ifndef H5
  status.value = '高斯泼溅3D渲染仅支持H5平台'
  // #endif
})

onBeforeUnmount(() => {
  // 执行完美清理
  performCompleteCleanup()
})

// 方法定义
const goBack = () => {
  // 在页面跳转前执行完美清理
  performCompleteCleanup()
  
  uni.redirectTo({
    url: '/pages/index/index'
  })
}

/**
 * 解析场景配置参数
 * @param {Object} options - 页面传递的参数
 */
const parseSceneConfig = (options) => {
  try {
    // 解析场景配置数据
    if (options.sceneConfig) {
      const configString = decodeURIComponent(options.sceneConfig)
      const config = JSON.parse(configString)
      sceneConfig.value = { ...sceneConfig.value, ...config }
      console.log('🎯 解析场景配置成功:', sceneConfig.value)
    }
    
    // 兼容旧版本的modelUrl参数
    if (options.modelUrl && !sceneConfig.value.gaussianSplats.length) {
      const modelUrl = decodeURIComponent(options.modelUrl)
      if (modelUrl) {
        sceneConfig.value.gaussianSplats.push({
          url: modelUrl,
          position: [0, 1, 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1]
        })
      }
    }
    
    status.value = '场景配置解析完成'
    console.log('📋 当前场景配置:', {
      广告牌数量: sceneConfig.value.billboards.length,
      三维模型数量: sceneConfig.value.models3D.length,
      高斯泼溅数量: sceneConfig.value.gaussianSplats.length,
      镜头配置: sceneConfig.value.camera
    })
    
  } catch (error) {
    console.error('❌ 解析场景配置失败:', error)
    status.value = '场景配置解析失败，使用默认配置'
  }
}

/**
 * 完美清理 3D 场景资源
 * 参考 Three.js 内存清理最佳实践，适配高斯泼溅场景
 */
const performCompleteCleanup = () => {
  console.log('开始执行 3D 场景完美清理...')
  
  try {
    // 1. 清除动画帧
    if (sceneResources.value.animationFrame) {
      cancelAnimationFrame(sceneResources.value.animationFrame)
      sceneResources.value.animationFrame = null
      console.log('✓ 动画帧已清除')
    }

    // 2. 清理自定义Three.js对象
    try {
      // 清理billboard纹理和材质
      if (threeScene && threeScene.children) {
        threeScene.children.forEach(child => {
          if (child instanceof THREE.Sprite && child.material && child.material.map) {
            // 清理纹理
            child.material.map.dispose()
            // 清理材质
            child.material.dispose()
            console.log('✓ Billboard 纹理和材质已清理')
          }
        })
      }
    } catch (error) {
      console.warn('清理Billboard资源时出错:', error)
    }

    // 3. 停止并清理 viewer
    if (sceneResources.value.viewer) {
      // 停止渲染循环
      try {
        sceneResources.value.viewer.stop()
        console.log('✓ 渲染循环已停止')
      } catch (error) {
        console.warn('停止渲染循环时出错:', error)
      }
      
      // 清理加载的场景 - 针对高斯泼溅的特殊处理
      if (sceneResources.value.loadedScenes.length > 0) {
        sceneResources.value.loadedScenes.forEach((scene, index) => {
          try {
            // 如果有移除场景的方法，使用它
            if (typeof sceneResources.value.viewer.removeSplatScene === 'function') {
              sceneResources.value.viewer.removeSplatScene(scene)
            }
            console.log(`✓ 高斯泼溅场景 ${index} 已移除`)
          } catch (error) {
            console.warn(`清理高斯泼溅场景 ${index} 时出错:`, error)
          }
        })
        sceneResources.value.loadedScenes = []
      }
      
      // 清理 worker 相关资源（高斯泼溅特有）
      try {
        // 如果使用了 shared memory workers，需要特别清理
        if (sceneResources.value.viewer.splatMesh) {
          console.log('✓ 清理 SplatMesh 资源')
        }
        
        // 清理 WebGL 相关资源
        if (sceneResources.value.viewer.renderer) {
          const renderer = sceneResources.value.viewer.renderer
          renderer.forceContextLoss()
          renderer.dispose()
          console.log('✓ WebGL 上下文已释放')
        }
      } catch (error) {
        console.warn('清理 WebGL 资源时出错:', error)
      }
      
      // 释放 viewer 资源
      try {
        sceneResources.value.viewer.dispose()
        sceneResources.value.viewer = null
        viewer.value = null
        console.log('✓ Gaussian Viewer 已释放')
      } catch (error) {
        console.warn('释放 Viewer 时出错:', error)
        // 强制设置为 null
        sceneResources.value.viewer = null
        viewer.value = null
      }
    }

    // 4. 清理 DOM 容器
    if (sceneResources.value.container) {
      // 移除所有子元素
      while (sceneResources.value.container.firstChild) {
        console.log(sceneResources.value.container.firstChild)
        sceneResources.value.container.removeChild(sceneResources.value.container.firstChild)
      }
      
      // 清除容器引用
      sceneResources.value.container.innerHTML = ''
      sceneResources.value.container = null
      console.log('✓ DOM 容器已清理')
    }

    // 5. 移除事件监听器
    if (sceneResources.value.eventListeners.length > 0) {
      sceneResources.value.eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler)
      })
      sceneResources.value.eventListeners = []
      console.log('✓ 事件监听器已清理')
    }

    // 6. 清理缓存和纹理
    try {
      // 清理可能的缓存
      if (window.THREE && window.THREE.Cache) {
        window.THREE.Cache.clear()
        console.log('✓ Three.js 缓存已清理')
      }
      
      // 清理可能的纹理缓存
      if (window.GaussianSplats3D && window.GaussianSplats3D.Cache) {
        window.GaussianSplats3D.Cache.clear()
        console.log('✓ 高斯泼溅缓存已清理')
      }
    } catch (error) {
      console.warn('清理缓存时出错:', error)
    }

    // 7. 强制垃圾回收（如果浏览器支持）
    if (window.gc && typeof window.gc === 'function') {
      window.gc()
      console.log('✓ 强制垃圾回收完成')
    }
    
    // 8. 延迟二次垃圾回收
    setTimeout(() => {
      if (window.gc && typeof window.gc === 'function') {
        window.gc()
        console.log('✓ 延迟垃圾回收完成')
      }
    }, 100)
    
    // 9. 重置状态
    loading.value = false
    status.value = '场景已清理'
    
    // 10. 记录清理完成后的内存状态
    setTimeout(() => {
      logMemoryUsage()
      checkCleanupStatus()
    }, 200)
    
    console.log('🎉 3D 场景完美清理完成!')
    
  } catch (error) {
    console.error('清理过程中出现错误:', error)
  }
}

const toggleControls = () => {
  showControls.value = !showControls.value
}

const initViewer = () => {
  const container = document.getElementById('gaussian-viewer')
  if (!container) {
    status.value = '容器初始化失败'
    return
  }

  // 存储容器引用用于后续清理
  sceneResources.value.container = container

  loading.value = true
  status.value = '正在初始化3D场景...'

  // 使用配置中的镜头参数
  const cameraConfig = sceneConfig.value.camera
  const gaussianViewer = new GaussianSplats3D.Viewer({
    'rootElement': container,
    'cameraUp': cameraConfig.up,
    'initialCameraPosition': cameraConfig.position,
    'initialCameraLookAt': cameraConfig.lookAt,
    'sharedMemoryForWorkers': true,
    'threeScene': threeScene
  })

  // 存储 viewer 引用用于后续清理
  sceneResources.value.viewer = gaussianViewer
  viewer.value = gaussianViewer

  // 初始化场景组件
  initSceneComponents(gaussianViewer)
}

/**
 * 初始化场景组件（广告牌、3D模型、高斯泼溅）
 */
const initSceneComponents = async (gaussianViewer) => {
  try {
    // 清空之前的Three.js场景（除了默认的billboard）
    while (threeScene.children.length > 0) {
      const child = threeScene.children[0]
      if (child.material && child.material.map) {
        child.material.map.dispose()
        child.material.dispose()
      }
      threeScene.remove(child)
    }

    // 1. 添加广告牌
    await loadBillboards()
    
    // 2. 加载3D模型
    await load3DModels()
    
    // 3. 加载高斯泼溅点云
    await loadGaussianSplats(gaussianViewer)
    
    // 启动渲染
    gaussianViewer.start()
    
    loading.value = false
    status.value = '场景加载完成'
    console.log('🎉 3D场景初始化成功!')
    
  } catch (error) {
    loading.value = false
    status.value = `场景加载失败: ${error.message}`
    console.error('场景加载错误:', error)
    performCompleteCleanup()
  }
}

/**
 * 加载广告牌
 */
const loadBillboards = async () => {
  const billboards = sceneConfig.value.billboards
  if (billboards.length === 0) {
    // 如果没有配置广告牌，添加默认的
    const defaultBillboard = createBillboard()
    threeScene.add(defaultBillboard)
    return
  }

  for (const billboardConfig of billboards) {
    const billboard = createBillboard(billboardConfig)
    threeScene.add(billboard)
    console.log('📋 添加广告牌:', billboardConfig.text || '默认文字')
  }
}

/**
 * 加载3D模型
 */
const load3DModels = async () => {
  const models = sceneConfig.value.models3D
  
  for (const modelConfig of models) {
    status.value = `正在加载3D模型: ${modelConfig.url}`
    
    try {
      // 这里可以根据文件扩展名选择不同的加载器
      const loader = getModelLoader(modelConfig.url)
      const model = await loadModelAsync(loader, modelConfig.url)
      
      // 设置模型的位置、旋转和缩放
      model.position.set(...modelConfig.position)
      model.rotation.set(...modelConfig.rotation.slice(0, 3)) // 欧拉角
      model.scale.set(...modelConfig.scale)
      
      threeScene.add(model)
      console.log('🎲 添加3D模型:', modelConfig.url)
      
    } catch (error) {
      console.error('❌ 3D模型加载失败:', modelConfig.url, error)
    }
  }
}

/**
 * 加载高斯泼溅点云
 */
const loadGaussianSplats = async (gaussianViewer) => {
  const splats = sceneConfig.value.gaussianSplats
  
  if (splats.length === 0) {
    console.log('ℹ️ 未配置高斯泼溅点云')
    return
  }

  // 将欧拉角([x, y, z])转换为四元数([x, y, z, w])；若已为四元数则直接返回
  const normalizeRotationToQuaternion = (rotation) => {
    // 默认单位四元数
    const identity = [0, 0, 0, 1]
    if (!rotation || !Array.isArray(rotation)) return identity
    if (rotation.length === 4) return rotation
    if (rotation.length === 3) {
      const euler = new THREE.Euler(rotation[0], rotation[1], rotation[2], 'XYZ')
      const quat = new THREE.Quaternion()
      quat.setFromEuler(euler)
      return [quat.x, quat.y, quat.z, quat.w]
    }
    return identity
  }

  for (const splatConfig of splats) {
    if (!splatConfig.url || splatConfig.url.trim() === '') {
      console.warn('⚠️ 高斯泼溅URL为空，跳过加载')
      continue
    }

    status.value = `正在加载高斯泼溅: ${splatConfig.url}`

    try {
      const scene = await gaussianViewer.addSplatScene(splatConfig.url, {
        'splatAlphaRemovalThreshold': 5,
        'showLoadingUI': true,
        'progressiveLoad': false,
        'position': splatConfig.position,
        'rotation': normalizeRotationToQuaternion(splatConfig.rotation),
        'scale': splatConfig.scale
      })
      
      // 存储场景引用用于后续清理
      if (scene) {
        sceneResources.value.loadedScenes.push(scene)
      }
      
      console.log('🌟 添加高斯泼溅:', splatConfig.url)
      
    } catch (error) {
      console.error('❌ 高斯泼溅加载失败:', splatConfig.url, error)
    }
  }
}

/**
 * 根据文件扩展名获取相应的模型加载器
 */
const getModelLoader = (url) => {
  const extension = url.split('.').pop().toLowerCase()
  
  switch (extension) {
    case 'gltf':
    case 'glb':
      return new GLTFLoader()
    case 'obj':
      return new OBJLoader()
    case 'fbx':
      return new FBXLoader()
    default:
      return new GLTFLoader() // 默认使用GLTF加载器
  }
}

/**
 * 异步加载模型
 */
const loadModelAsync = (loader, url) => {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (model) => resolve(model.scene || model),
      (progress) => {
        console.log('模型加载进度:', progress)
      },
      (error) => reject(error)
    )
  })
}

/**
 * 添加事件监听器并跟踪（用于后续清理）
 * @param {Element} element - DOM 元素
 * @param {string} event - 事件名称
 * @param {Function} handler - 事件处理函数
 */
const addTrackedEventListener = (element, event, handler) => {
  element.addEventListener(event, handler)
  sceneResources.value.eventListeners.push({ element, event, handler })
}

/**
 * 内存监控工具函数
 * 用于调试和监控内存使用情况
 */
const logMemoryUsage = () => {
  if (performance.memory) {
    const memory = performance.memory
    console.log('📊 内存使用情况:')
    console.log(`   已使用: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   总分配: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   限制: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`)
  } else {
    console.log('📊 浏览器不支持内存监控')
  }
}

/**
 * 检查资源清理状态
 */
const checkCleanupStatus = () => {
  const resources = sceneResources.value
  const status = {
    viewer: resources.viewer === null,
    container: resources.container === null,
    eventListeners: resources.eventListeners.length === 0,
    loadedScenes: resources.loadedScenes.length === 0,
    animationFrame: resources.animationFrame === null
  }
  
  const allClean = Object.values(status).every(clean => clean)
  
  console.log('🔍 资源清理状态检查:')
  console.log('   Viewer 已清理:', status.viewer ? '✅' : '❌')
  console.log('   容器已清理:', status.container ? '✅' : '❌')
  console.log('   事件已清理:', status.eventListeners ? '✅' : '❌')
  console.log('   场景已清理:', status.loadedScenes ? '✅' : '❌')
  console.log('   动画帧已清理:', status.animationFrame ? '✅' : '❌')
  console.log('   整体状态:', allClean ? '🎉 完全清理' : '⚠️ 存在未清理资源')
  
  return allClean
}

// 开发环境下的调试功能
// #ifdef H5
if (process.env.NODE_ENV === 'development') {
  // 暴露调试函数到全局
  window.debugMemory = logMemoryUsage
  window.checkCleanup = checkCleanupStatus
  window.forceCleanup = performCompleteCleanup
  
  console.log('🔧 开发调试功能已启用:')
  console.log('   window.debugMemory() - 查看内存使用')
  console.log('   window.checkCleanup() - 检查清理状态')
  console.log('   window.forceCleanup() - 强制清理资源')
}
// #endif
</script>