<template>
  <!-- #ifdef H5 -->
  <transition name="transparent-fade" appear>
    <view
      v-if="playingVideo && activeVideo"
      class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <view
        class="relative pointer-events-auto video-modal-panel"
        :style="videoContainerStyle"
      >
        <div
          ref="playerContainerRef"
          class="w-full h-full bg-black"
        />
        <view
          class="resize-handle"
          @mousedown.stop="handleResizeMouseDown"
          @touchstart.stop="handleResizeTouchStart"
        />
      </view>
    </view>
  </transition>
  <!-- #endif -->
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
// #ifdef H5
import { createHikPlayer, loadWebVideoCtrl, STREAM_TYPE } from 'hikvideoctrl'
// #endif

const props = defineProps({
  playingVideo: {
    type: Boolean,
    default: false
  },
  activeVideo: {
    type: Object,
    default: null
  }
})

// 海康设备固定配置
const HIK_CONFIG = {
  host: '192.168.1.64',
  port: 80,
  protocol: 'http',
  username: 'admin',
  password: 'Sxtc10000'
}

// --- 播放器状态 ---
const playerContainerRef = ref(null)
let player = null
let deviceSession = null
const playing = ref(false)
const error = ref('')

// 确保底层 SDK 只加载一次
let sdkLoaded = false
const ensureSdkLoaded = async () => {
  if (sdkLoaded) return
  // #ifdef H5
  await loadWebVideoCtrl('/codebase/webVideoCtrl.js')
  // #endif
  sdkLoaded = true
}

// 获取目标通道号
const getTargetChannel = (video) => {
  if (!video || typeof video !== 'object') return null

  const camera = video.camera && typeof video.camera === 'object' ? video.camera : null

  const channel = camera?.channel ?? video.channel
  if (channel !== undefined && channel !== null) {
    const num = Number(channel)
    return Number.isFinite(num) && num > 0 ? num : null
  }
  return null
}

// 初始化并开始播放
const startPlayback = async () => {
  if (!props.playingVideo || !props.activeVideo) return

  await nextTick()
  if (!playerContainerRef.value) return

  try {
    await ensureSdkLoaded()

    // #ifdef H5
    player = createHikPlayer()
    await player.init({
      container: playerContainerRef.value,
      width: '100%',
      height: '100%',
      layout: 1
    })

    deviceSession = await player.login(HIK_CONFIG)

    const channels = await player.getChannels(deviceSession.id)
    const onlineChannel = channels.find(c => c.online && c.enabled)

    if (!onlineChannel) {
      error.value = '没有可播放的通道'
      return
    }

    const targetChannel = getTargetChannel(props.activeVideo) ?? Number(onlineChannel.id)

    const streamType = props.activeVideo.streamType
      ?? props.activeVideo.camera?.streamType
      ?? STREAM_TYPE.Main

    // 内网 HTTP 直连场景，无需 useProxy / webSocketPort 等额外参数
    await player.startPreview(deviceSession.id, {
      channel: targetChannel,
      streamType: streamType
    })

    playing.value = true
    error.value = ''
    // #endif
  } catch (err) {
    console.error('海康视频播放失败:', err)
    error.value = err?.message || '视频播放失败'
    await cleanup()
  }
}

// 停止并销毁播放器
const cleanup = async () => {
  // #ifdef H5
  if (player) {
    try {
      await player.destroy()
    } catch (e) {
      // ignore
    }
    player = null
  }
  // #endif
  deviceSession = null
  playing.value = false
  error.value = ''
}

// 监听 visible 变化
watch(() => props.playingVideo, async (val) => {
  if (val) {
    await startPlayback()
  } else {
    await cleanup()
  }
})

// 监听 activeVideo 变化（切换通道）
watch(() => props.activeVideo, async (newVal, oldVal) => {
  if (!props.playingVideo || !newVal) return
  // 对比关键字段，避免不必要的重建
  if (newVal === oldVal) return
  const newChannel = getTargetChannel(newVal)
  const oldChannel = getTargetChannel(oldVal)
  if (newChannel === oldChannel
    && (newVal.streamType ?? newVal.camera?.streamType) === (oldVal?.streamType ?? oldVal?.camera?.streamType)) {
    return
  }
  // 通道或码流变化，重建播放
  await cleanup()
  await nextTick()
  await startPlayback()
})

onBeforeUnmount(async () => {
  await cleanup()
})

// --- 尺寸调整逻辑 ---
const defaultPlayerWidth = 960
const defaultPlayerHeight = 540
const minPlayerWidth = 240
const minPlayerHeight = 180

const parsePixelValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round(value)
  if (typeof value !== 'string') return 0
  const trimmed = value.trim()
  if (!trimmed) return 0
  const matched = trimmed.match(/^(\d+(?:\.\d+)?)/)
  if (!matched) return 0
  const num = Number(matched[1])
  if (!Number.isFinite(num) || num <= 0) return 0
  return Math.round(num)
}

const getConfiguredPlayerSize = (video) => {
  if (!video || typeof video !== 'object') return { width: 0, height: 0 }
  const camera = video.camera && typeof video.camera === 'object' ? video.camera : null
  const width = parsePixelValue(
    camera?.playerWidth ?? camera?.width ?? video.playerWidth ?? video.width
  )
  const height = parsePixelValue(
    camera?.playerHeight ?? camera?.height ?? video.playerHeight ?? video.height
  )
  return { width, height }
}

const configuredPlayerSize = computed(() => getConfiguredPlayerSize(props.activeVideo))

const playerWidth = ref(defaultPlayerWidth)
const playerHeight = ref(defaultPlayerHeight)

const resizing = ref(false)
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

const getViewportSize = () => {
  try {
    const info = uni.getSystemInfoSync?.()
    const windowWidth = Number(info?.windowWidth)
    const windowHeight = Number(info?.windowHeight)
    return {
      width: Number.isFinite(windowWidth) && windowWidth > 0 ? windowWidth : 0,
      height: Number.isFinite(windowHeight) && windowHeight > 0 ? windowHeight : 0
    }
  } catch (error) {
    return { width: 0, height: 0 }
  }
}

const clampPlayerSize = ({ width, height }) => {
  const viewport = getViewportSize()
  const maxWidth = viewport.width ? Math.max(minPlayerWidth, Math.round(viewport.width - 32)) : 99999
  const maxHeight = viewport.height ? Math.max(minPlayerHeight, Math.round(viewport.height - 32)) : 99999
  return {
    width: Math.min(Math.max(Math.round(width), minPlayerWidth), maxWidth),
    height: Math.min(Math.max(Math.round(height), minPlayerHeight), maxHeight)
  }
}

const applyPlayerSize = (nextWidth, nextHeight) => {
  const next = clampPlayerSize({ width: nextWidth, height: nextHeight })
  playerWidth.value = next.width
  playerHeight.value = next.height
}

const resetPlayerSizeFromConfig = () => {
  applyPlayerSize(
    configuredPlayerSize.value.width || defaultPlayerWidth,
    configuredPlayerSize.value.height || defaultPlayerHeight
  )
}

watch(configuredPlayerSize, resetPlayerSizeFromConfig, { immediate: true })

const stopResize = () => {
  if (!resizing.value) return
  resizing.value = false
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', handleResizeMove, true)
    window.removeEventListener('mouseup', stopResize, true)
    window.removeEventListener('touchmove', handleResizeTouchMove, { capture: true })
    window.removeEventListener('touchend', stopResize, true)
    window.removeEventListener('touchcancel', stopResize, true)
  }
}

const handleResizeMove = (event) => {
  if (!resizing.value) return
  const dx = event.clientX - resizeStart.value.x
  const dy = event.clientY - resizeStart.value.y
  applyPlayerSize(resizeStart.value.width + dx, resizeStart.value.height + dy)
}

const handleResizeTouchMove = (event) => {
  if (!resizing.value) return
  const touch = event.touches?.[0]
  if (!touch) return
  const dx = touch.clientX - resizeStart.value.x
  const dy = touch.clientY - resizeStart.value.y
  applyPlayerSize(resizeStart.value.width + dx, resizeStart.value.height + dy)
}

const startResizeWithPoint = (x, y) => {
  resizing.value = true
  resizeStart.value = { x, y, width: playerWidth.value, height: playerHeight.value }
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', handleResizeMove, true)
    window.addEventListener('mouseup', stopResize, true)
    window.addEventListener('touchmove', handleResizeTouchMove, { capture: true, passive: false })
    window.addEventListener('touchend', stopResize, true)
    window.addEventListener('touchcancel', stopResize, true)
  }
}

const handleResizeMouseDown = (event) => {
  event.preventDefault?.()
  startResizeWithPoint(event.clientX, event.clientY)
}

const handleResizeTouchStart = (event) => {
  const touch = event.touches?.[0]
  if (!touch) return
  event.preventDefault?.()
  startResizeWithPoint(touch.clientX, touch.clientY)
}

onBeforeUnmount(() => {
  stopResize()
})

const videoContainerStyle = computed(() => ({
  width: `${playerWidth.value}px`,
  height: `${playerHeight.value}px`,
  maxWidth: 'calc(100vw - 2rem)',
  maxHeight: 'calc(100vh - 2rem)',
  userSelect: resizing.value ? 'none' : '',
  overflow: 'hidden'
}))

defineExpose({
  getPlayerSize: () => ({
    playerWidth: playerWidth.value,
    playerHeight: playerHeight.value,
    contentScale: 1 // 保持向后兼容
  })
})
</script>

<style scoped>
:deep(uni-video),
:deep(video) {
  width: 100% !important;
  height: 100% !important;
}

:deep(uni-video) {
  height: 100% !important;
}

:deep(uni-video video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain;
}

.video-modal-panel {
  transition: opacity 1s ease, transform 1s ease;
}

.transparent-fade-enter-active,
.transparent-fade-leave-active {
  transition: opacity 1s ease, transform 1s ease;
}

.transparent-fade-enter-from,
.transparent-fade-leave-to {
  opacity: 0;
}

.transparent-fade-enter-from .video-modal-panel,
.transparent-fade-leave-to .video-modal-panel {
  opacity: 0;
  transform: scale(0.96);
}

.resize-handle {
  position: absolute;
  right: -8px;
  bottom: -8px;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 9999px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  cursor: nwse-resize;
}
</style>
