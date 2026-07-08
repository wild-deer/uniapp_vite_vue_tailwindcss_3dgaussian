import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const normalizeRouteParam = (value) => (Array.isArray(value) ? value[0] : value)

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

const requestSceneConfig = (sceneConfigUrl) =>
  new Promise((resolve, reject) => {
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

export function useSceneConfigLoader(sceneStore) {
  const routeOptions = ref({})

  onLoad((options) => {
    routeOptions.value = options || {}
  })

  const ensureSceneConfigReady = async () => {
    if (sceneStore.hasSceneConfig) {
      return true
    }

    const sceneConfigUrl = decodeRouteParam(routeOptions.value.sceneConfigUrl)
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

  return {
    routeOptions,
    ensureSceneConfigReady
  }
}

