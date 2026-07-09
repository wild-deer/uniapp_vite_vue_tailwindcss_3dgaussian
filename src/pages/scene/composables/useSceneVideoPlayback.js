import { computed, onBeforeUnmount, ref } from 'vue'

const VIDEO_PLAYBACK_DELAY_MS = 1000

const normalizeVideoUrl = (value) => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

const getVideoUrl = (video) => {
  if (!video) return ''
  if (typeof video === 'string') return normalizeVideoUrl(video)
  return normalizeVideoUrl(video.url || video.videoUrl || video.src)
}

const getVideoCameraView = (video) => {
  const position = video?.camera?.position || video?.position
  const lookAt = video?.camera?.lookAt || video?.lookAt
  const up = video?.camera?.up || video?.up
  const duration = Number.isFinite(video?.camera?.duration) ? video.camera.duration : video?.duration

  return {
    position,
    lookAt,
    ...(up ? { up } : {}),
    ...(Number.isFinite(duration) ? { duration } : {})
  }
}

export function useSceneVideoPlayback(sceneStore, { moveCameraToView } = {}) {
  const pendingVideoPlaybackTimeoutId = ref(null)
  const latestVideoSelectionToken = ref(0)

  const availableVideos = computed(() =>
    Array.isArray(sceneStore.sceneConfig?.videos) ? sceneStore.sceneConfig.videos : []
  )

  const clearPendingVideoPlaybackDelay = () => {
    if (pendingVideoPlaybackTimeoutId.value !== null) {
      clearTimeout(pendingVideoPlaybackTimeoutId.value)
      pendingVideoPlaybackTimeoutId.value = null
    }
  }

  const cancelPendingVideoPlayback = () => {
    latestVideoSelectionToken.value += 1
    clearPendingVideoPlaybackDelay()
  }

  const waitForVideoPlaybackDelay = () =>
    new Promise((resolve) => {
      clearPendingVideoPlaybackDelay()
      pendingVideoPlaybackTimeoutId.value = setTimeout(() => {
        pendingVideoPlaybackTimeoutId.value = null
        resolve()
      }, VIDEO_PLAYBACK_DELAY_MS)
    })

  const hasVideoSource = (video) => {
    if (!video || typeof video !== 'object') return false
    const url = getVideoUrl(video)
    if (url) return true
    // 海康摄像头通过 channel 或 camera 属性标识
    if (video.channel !== undefined && video.channel !== null) return true
    if (video.camera && typeof video.camera === 'object') return true
    return false
  }

  const selectVideo = async (video) => {
    cancelPendingVideoPlayback()
    const currentSelectionToken = latestVideoSelectionToken.value

    if (!hasVideoSource(video)) {
      uni.showToast({
        title: '视频地址缺失',
        icon: 'none'
      })
      return
    }

    const url = getVideoUrl(video)

    sceneStore.setInteractionLocked(true)

    const cameraView = getVideoCameraView(video)
    sceneStore.setStatus('正在切换镜头...')

    const moved = await moveCameraToView?.(cameraView)
    if (!moved) {
      sceneStore.setInteractionLocked(false)
      uni.showToast({
        title: '镜头切换失败',
        icon: 'none'
      })
      return
    }

    sceneStore.setStatus('镜头切换完成，准备播放视频...')
    await waitForVideoPlaybackDelay()
    if (currentSelectionToken !== latestVideoSelectionToken.value) {
      return
    }

    sceneStore.startVideoPlayback({
      ...(typeof video === 'object' ? video : null),
      url
    })
    sceneStore.setStatus('视频播放中')
  }

  const closeVideo = () => {
    cancelPendingVideoPlayback()
    sceneStore.stopVideoPlayback()
    sceneStore.setInteractionLocked(false)
    sceneStore.setStatus('场景加载完成')
  }

  onBeforeUnmount(() => {
    cancelPendingVideoPlayback()
  })

  return {
    availableVideos,
    selectVideo,
    closeVideo,
    cancelPendingVideoPlayback,
    getVideoUrl,
    getVideoCameraView
  }
}

