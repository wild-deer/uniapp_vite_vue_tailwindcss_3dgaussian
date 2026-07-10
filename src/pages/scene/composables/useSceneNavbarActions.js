import { computed } from 'vue'

// #ifdef H5
import * as THREE from 'three'
// #endif

export function useSceneNavbarActions(sceneStore, deps) {
  const {
    videoModalRef,
    viewer,
    closeVideo,
    resetCameraView,
    copySelectedWorldText,
    worldTextDebugOptions,
    selectedWorldTextIndex,
    selectedWorldTextAngle,
    selectedWorldTextTiltAngle,
    selectedWorldTextRollAngle,
    selectedWorldTextPosition,
    selectedWorldTextScale,
    selectWorldTextByIndex,
    setSelectedWorldTextAngle,
    setSelectedWorldTextTiltAngle,
    setSelectedWorldTextRollAngle,
    setSelectedWorldTextPosition,
    setSelectedWorldTextScale
  } = deps

  const showToast = (title, icon = 'none') => {
    uni.showToast({ title, icon })
  }

  const copyToClipboard = (data, successTitle) => {
    uni.setClipboardData({
      data,
      success: () => {
        showToast(successTitle, 'success')
      },
      fail: () => {
        showToast('复制失败')
      }
    })
  }

  const worldTextOptions = computed(() => worldTextDebugOptions?.value || [])
  const selectedWorldTextAngleValue = computed(() => selectedWorldTextAngle?.value || 0)
  const selectedWorldTextTiltAngleValue = computed(() => selectedWorldTextTiltAngle?.value || 0)
  const selectedWorldTextRollAngleValue = computed(() => selectedWorldTextRollAngle?.value || 0)
  const selectedWorldTextPositionValue = computed(() => selectedWorldTextPosition?.value || [])
  const selectedWorldTextScaleValue = computed(() => selectedWorldTextScale?.value || [])
  const selectedWorldTextIndexValue = computed(() => selectedWorldTextIndex?.value ?? -1)

  const selectWorldText = (index) => {
    const selected = selectWorldTextByIndex?.(index)
    if (!selected) {
      showToast('标牌选择失败')
    }
  }

  const showWorldTextSelectionToast = () => {
    if (!sceneStore.debugMode) return
    showToast('请先选择一个标牌')
  }

  const updateWorldTextAngle = (angle) => {
    const updated = setSelectedWorldTextAngle?.(angle)
    if (!updated) {
      showWorldTextSelectionToast()
    }
  }

  const updateWorldTextTiltAngle = (tiltAngle) => {
    const updated = setSelectedWorldTextTiltAngle?.(tiltAngle)
    if (!updated) {
      showWorldTextSelectionToast()
    }
  }

  const updateWorldTextRollAngle = (rollAngle) => {
    const updated = setSelectedWorldTextRollAngle?.(rollAngle)
    if (!updated) {
      showWorldTextSelectionToast()
    }
  }

  const updateWorldTextPosition = (position) => {
    const updated = setSelectedWorldTextPosition?.(position)
    if (!updated) {
      showWorldTextSelectionToast()
    }
  }

  const updateWorldTextScale = (scale) => {
    const updated = setSelectedWorldTextScale?.(scale)
    if (!updated) {
      showWorldTextSelectionToast()
    }
  }

  const copyWorldTextConfig = () => {
    const data = copySelectedWorldText?.()
    if (!data) {
      showToast('请先开启调试并选中标牌')
      return
    }

    copyToClipboard(data, '已复制标牌参数')
  }

  const resetCamera = async () => {
    const hasReset = await resetCameraView?.()
    if (hasReset) {
      sceneStore.setStatus('镜头已重置')
      return
    }

    showToast('当前平台不支持重置镜头')
  }

  const exitVideo = async () => {
    closeVideo?.()
    await resetCamera()
  }

  const copyCameraView = () => {
    const gaussianViewer = viewer?.value
    const camera = gaussianViewer?.camera

    if (!camera) {
      showToast('当前平台不支持复制镜头')
      return
    }

    const formatNumber = (value) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return value
      return Number(value.toFixed(5))
    }

    const formatVector3 = (vec3) => [
      formatNumber(vec3.x),
      formatNumber(vec3.y),
      formatNumber(vec3.z)
    ]

    const position = formatVector3(camera.position)

    let lookAtVec = gaussianViewer?.controls?.target?.clone?.()
    if (!lookAtVec) {
      if (typeof THREE === 'undefined') {
        showToast('当前平台不支持复制镜头')
        return
      }

      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)
      lookAtVec = camera.position.clone().add(direction)
    }
    const lookAt = formatVector3(lookAtVec)

    const data = `"position": ${JSON.stringify(position)},\n"lookAt": ${JSON.stringify(lookAt)}`
    copyToClipboard(data, '已复制镜头参数')
  }

  const copyVideoPlayerSize = () => {
    const getPlayerSize = videoModalRef.value?.getPlayerSize
    const size = typeof getPlayerSize === 'function' ? getPlayerSize() : null
    const width = Number(size?.playerWidth)
    const height = Number(size?.playerHeight)

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      showToast('未获取到播放尺寸')
      return
    }

    const clipTop = Number(size?.clipTop) || 0
    const clipRight = Number(size?.clipRight) || 0
    const clipBottom = Number(size?.clipBottom) || 0
    const clipLeft = Number(size?.clipLeft) || 0
    const hasClip = clipTop || clipRight || clipBottom || clipLeft
    const featherEdge = size?.featherEdge === true
    const featherRadius = Number(size?.featherRadius) || 30

    let data = `"playerWidth": ${Math.round(width)},\n"playerHeight": ${Math.round(height)},\n"contentScale": ${size.contentScale ?? 1}`
    if (hasClip) {
      data += `,\n"clipTop": ${clipTop},\n"clipRight": ${clipRight},\n"clipBottom": ${clipBottom},\n"clipLeft": ${clipLeft}`
    }
    if (featherEdge) {
      data += `,\n"featherEdge": true,\n"featherRadius": ${featherRadius}`
    }
    copyToClipboard(data, '已复制播放尺寸')
  }

  const updateVideoOffset = ({ edge, value }) => {
    const setter = videoModalRef.value?.setVideoOffset
    if (typeof setter === 'function') {
      setter(edge, value)
    }
  }

  const updateFeatherEnabled = (enabled) => {
    const setter = videoModalRef.value?.setFeatherEnabled
    if (typeof setter === 'function') {
      setter(enabled)
    }
  }

  const updateFeatherRadius = (radius) => {
    const setter = videoModalRef.value?.setFeatherRadius
    if (typeof setter === 'function') {
      setter(radius)
    }
  }

  return {
    worldTextOptions,
    selectedWorldTextAngleValue,
    selectedWorldTextTiltAngleValue,
    selectedWorldTextRollAngleValue,
    selectedWorldTextPositionValue,
    selectedWorldTextScaleValue,
    selectedWorldTextIndexValue,
    selectWorldText,
    updateWorldTextAngle,
    updateWorldTextTiltAngle,
    updateWorldTextRollAngle,
    updateWorldTextPosition,
    updateWorldTextScale,
    copyWorldTextConfig,
    resetCamera,
    exitVideo,
    copyCameraView,
    copyVideoPlayerSize,
    updateVideoOffset,
    updateFeatherEnabled,
    updateFeatherRadius
  }
}

