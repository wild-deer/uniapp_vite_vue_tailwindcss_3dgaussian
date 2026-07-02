<template>
  <view class="flex flex-col h-screen bg-black">
    <SceneNavbar
      :is-development="sceneStore.isDevelopment"
      @back="goBack"
      @toggle-controls="sceneStore.toggleControls"
      @reset-camera="resetCamera"
      @copy-camera="copyCameraView"
      @log-memory="logMemoryUsage"
    />

    <!-- 3D场景容器 -->
    <view class="flex-1 relative overflow-hidden">
      <!-- H5平台使用div容器 -->
      <!-- #ifdef H5 -->
      <view class="absolute inset-0 w-full h-full" id="gaussian-viewer"></view>
      <!-- #endif -->
      
      <!-- 非H5平台提示 -->
      <!-- #ifndef H5 -->
      <view class="flex items-center justify-center h-full bg-gray-800">
        <text class="text-white text-center">{{ sceneStore.status }}</text>
      </view>
      <!-- #endif -->
    </view>

    <!-- 状态显示 -->
    <view 
      v-if="sceneStore.loading || sceneStore.status !== '场景加载完成'" 
      class="absolute top-20 left-4 bg-black/70 backdrop-blur-md p-4 rounded-lg max-w-xs"
    >
      <text class="text-white text-sm">{{ sceneStore.status }}</text>
    </view>

    <!-- 操作说明面板 -->
    <SceneControlsPanel
      v-if="sceneStore.showControls"
      @close="sceneStore.toggleControls"
    />
  </view>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SceneNavbar from './components/SceneNavbar.vue'
import SceneControlsPanel from './components/SceneControlsPanel.vue'
import { useSceneStore } from '../../stores/scene'

// #ifdef H5
import * as THREE from 'three'
import { useSceneViewer } from './composables/useSceneViewer'
// #endif

const sceneStore = useSceneStore()
let routeOptions = {}

let viewer
let initViewer
let performCompleteCleanup
let logMemoryUsage
let resetCameraView

// #ifdef H5
;({ viewer, initViewer, performCompleteCleanup, logMemoryUsage, resetCameraView } = useSceneViewer(sceneStore))
// #endif

const normalizeRouteParam = (value) => Array.isArray(value) ? value[0] : value

const decodeRouteParam = (value) => {
  const normalizedValue = normalizeRouteParam(value)
  if (!normalizedValue) return ''

  try {
    return decodeURIComponent(normalizedValue)
  } catch (error) {
    console.warn('路由参数解码失败，使用原始值:', normalizedValue, error)
    return normalizedValue
  }
}

const parseSceneConfigResponse = (rawData) => {
  const parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData

  if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
    throw new Error('场景配置格式无效')
  }

  return parsedData
}

const requestSceneConfig = (sceneConfigUrl) => new Promise((resolve, reject) => {
  uni.request({
    url: sceneConfigUrl,
    method: 'GET',
    success: (response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        reject(new Error(`HTTP ${response.statusCode}`))
        return
      }

      try {
        resolve(parseSceneConfigResponse(response.data))
      } catch (error) {
        reject(error)
      }
    },
    fail: reject
  })
})

const ensureSceneConfigReady = async () => {
  if (sceneStore.hasSceneConfig) {
    return true
  }

  const sceneConfigUrl = decodeRouteParam(routeOptions.sceneConfigUrl)
  if (!sceneConfigUrl) {
    return false
  }

  sceneStore.setLoading(true)
  sceneStore.setStatus('正在下载场景配置...')

  try {
    const remoteSceneConfig = await requestSceneConfig(sceneConfigUrl)
    sceneStore.setSceneConfig(remoteSceneConfig)
    sceneStore.setLoading(false)
    sceneStore.setStatus('场景配置下载完成')
    console.log('📥 场景配置下载成功:', sceneConfigUrl, remoteSceneConfig)
    return true
  } catch (error) {
    sceneStore.resetSceneConfig()
    sceneStore.setLoading(false)
    sceneStore.setStatus(`场景配置下载失败: ${error.message}`)
    console.error('❌ 场景配置下载失败:', sceneConfigUrl, error)
    uni.showToast({
      title: '场景配置下载失败',
      icon: 'none'
    })
    return false
  }
}

onLoad((options) => {
  routeOptions = options || {}
})

onMounted(async () => {
  const hasSceneConfig = await ensureSceneConfigReady()
  if (!hasSceneConfig && !sceneStore.hasSceneConfig) {
    sceneStore.setLoading(false)
    sceneStore.setStatus('未找到场景配置，请返回首页重新进入')
    return
  }

  // 在H5环境下初始化viewer
  // #ifdef H5
  sceneStore.setIsDevelopment(process.env.NODE_ENV === 'development')
  console.log('🚀 初始化 3D 场景，记录初始内存状态:')
  logMemoryUsage?.()
  initViewer?.()
  // #endif

  // 非H5平台提示
  // #ifndef H5
  sceneStore.setStatus('高斯泼溅3D渲染仅支持H5平台')
  // #endif
})

onBeforeUnmount(() => {
  // 执行完美清理
  performCompleteCleanup?.()
})

// 方法定义
const goBack = () => {
  // 在页面跳转前执行完美清理
  performCompleteCleanup?.()
  
  uni.redirectTo({
    url: '/pages/index/index'
  })
}

const copyCameraView = () => {
  const gaussianViewer = viewer?.value
  const camera = gaussianViewer?.camera

  if (!camera) {
    uni.showToast({
      title: '当前平台不支持复制镜头',
      icon: 'none'
    })
    return
  }

  const formatNumber = (value) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return String(value)
    return value.toFixed(5).replace(/\.?0+$/, '')
  }

  const formatVector3 = (vec3) => [
    formatNumber(vec3.x),
    formatNumber(vec3.y),
    formatNumber(vec3.z)
  ]

  const position = formatVector3(camera.position)

  let lookAtVec = gaussianViewer?.controls?.target?.clone?.()
  if (!lookAtVec) {
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    lookAtVec = camera.position.clone().add(direction)
  }
  const lookAt = formatVector3(lookAtVec)

  const data = `position: [${position.join(', ')}],\nlookAt: [${lookAt.join(', ')}],`

  uni.setClipboardData({
    data,
    success: () => {
      uni.showToast({
        title: '已复制镜头参数',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
  })
}

const resetCamera = () => {
  const hasReset = resetCameraView?.()
  if (hasReset) {
    sceneStore.setStatus('镜头已重置')
    return
  }

  uni.showToast({
    title: '当前平台不支持重置镜头',
    icon: 'none'
  })
}
</script>
