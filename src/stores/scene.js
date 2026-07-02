import { defineStore } from 'pinia'
import { ref } from 'vue'

const createDefaultSceneConfig = () => ({
  billboards: [],
  worldTexts: [],
  models3D: [],
  gaussianSplats: [],
  camera: {
    position: [-1, -4, 6],
    up: [0, -1, 0],
    lookAt: [0, 4, 0]
  }
})

export const useSceneStore = defineStore('scene', () => {
  const loading = ref(false)
  const status = ref('准备加载3D场景')
  const showControls = ref(false)
  const isDevelopment = ref(false)
  const hasSceneConfig = ref(false)
  const sceneConfig = ref(createDefaultSceneConfig())

  const setLoading = (value) => {
    loading.value = !!value
  }

  const setStatus = (value) => {
    status.value = value || ''
  }

  const setIsDevelopment = (value) => {
    isDevelopment.value = !!value
  }

  const toggleControls = () => {
    showControls.value = !showControls.value
  }

  const resetSceneConfig = () => {
    sceneConfig.value = createDefaultSceneConfig()
  }

  const mergeSceneConfig = (partialConfig) => {
    sceneConfig.value = {
      ...sceneConfig.value,
      ...(partialConfig || {})
    }
  }

  const logSceneConfigSummary = () => {
    console.log('📋 当前场景配置:', {
      广告牌数量: sceneConfig.value.billboards.length,
      固定文本数量: sceneConfig.value.worldTexts.length,
      三维模型数量: sceneConfig.value.models3D.length,
      高斯泼溅数量: sceneConfig.value.gaussianSplats.length,
      镜头配置: sceneConfig.value.camera
    })
  }

  const appendGaussianSplat = (modelUrl) => {
    if (!modelUrl || sceneConfig.value.gaussianSplats.length) return

    sceneConfig.value.gaussianSplats.push({
      url: modelUrl,
      position: [0, 1, 0],
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1]
    })
  }

  const applySceneSelection = ({ sceneConfig: nextSceneConfig, modelUrl } = {}) => {
    resetSceneConfig()

    if (nextSceneConfig) {
      mergeSceneConfig(nextSceneConfig)
      console.log('🎯 解析场景配置成功:', sceneConfig.value)
    }

    appendGaussianSplat(modelUrl)
    hasSceneConfig.value = !!(nextSceneConfig || modelUrl)

    setStatus(hasSceneConfig.value ? '场景配置准备完成' : '未提供场景配置，使用默认配置')
    logSceneConfigSummary()
  }

  const setSceneConfig = (nextSceneConfig) => {
    try {
      applySceneSelection({ sceneConfig: nextSceneConfig })
    } catch (error) {
      hasSceneConfig.value = false
      resetSceneConfig()
      console.error('❌ 写入场景配置失败:', error)
      setStatus('场景配置设置失败，使用默认配置')
    }
  }

  const setSceneFromSelection = (scene) => {
    try {
      applySceneSelection(scene)
    } catch (error) {
      hasSceneConfig.value = false
      resetSceneConfig()
      console.error('❌ 设置场景配置失败:', error)
      setStatus('场景配置设置失败，使用默认配置')
    }
  }

  return {
    loading,
    status,
    showControls,
    isDevelopment,
    hasSceneConfig,
    sceneConfig,
    setLoading,
    setStatus,
    setIsDevelopment,
    toggleControls,
    resetSceneConfig,
    mergeSceneConfig,
    setSceneConfig,
    setSceneFromSelection
  }
})
