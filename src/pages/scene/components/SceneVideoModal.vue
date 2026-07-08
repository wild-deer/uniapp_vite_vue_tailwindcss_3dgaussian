<template>
  <!-- #ifdef H5 -->
  <!-- 
    修改点：
    - 去掉了 pt-16
    - 将 items-start 改为 items-center，实现垂直居中
    - justify-center 保持不变，实现水平居中
  -->
  <transition name="transparent-fade" appear>
    <view
      v-if="playingVideo && activeVideo"
      class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <!-- pointer-events-auto 恢复视频区域内部的点击事件 -->
      <view
        class="relative pointer-events-auto video-modal-panel"
        :style="videoContainerStyle"
      >
        <view class="content-layer" :style="contentStyle">
          <img
            v-if="isRealtimeImageStream"
            :src="activeVideoUrl"
            class="w-full h-full block bg-black shadow-xl realtime-stream"
            alt="实时视频流"
          >
          <video
            v-else-if="activeVideoUrl"
            :src="activeVideoUrl"
            class="w-full h-full block bg-black shadow-xl"
            controls
            autoplay
            playsinline
          />
        </view>
        <view
          class="resize-handle"
          @mousedown.stop="handleResizeMouseDown"
          @touchstart.stop="handleResizeTouchStart"
        />
        <view
          class="content-resize-handle"
          @mousedown.stop="handleContentResizeMouseDown"
          @touchstart.stop="handleContentResizeTouchStart"
        />
      </view>
    </view>
  </transition>
  <!-- #endif -->
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

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

const normalizeVideoUrl = (value) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''

  const rtspProxyBase = 'http://192.168.1.207:3334/camera/stream?url='

  if (/^rtsp:\/\//i.test(trimmed)) {
    return `${rtspProxyBase}${encodeURIComponent(trimmed)}`
  }

  const rtspQueryMatched = trimmed.match(/^(.*[?&]url=)(rtsp:\/\/.*)$/i)
  if (rtspQueryMatched) {
    return `${rtspQueryMatched[1]}${encodeURIComponent(rtspQueryMatched[2])}`
  }

  return trimmed
}

const getVideoUrl = (video) => {
  if (!video) return ''
  if (typeof video === 'string') return normalizeVideoUrl(video)
  return normalizeVideoUrl(video.url || video.videoUrl || video.src)
}

const isRealtimeStreamUrl = (value) => {
  if (typeof value !== 'string') return false
  return /\/camera\/stream\?url=/i.test(value)
}

const defaultPlayerWidth = 960
const defaultPlayerHeight = 540
const minPlayerWidth = 240
const minPlayerHeight = 180
const defaultContentScale = 1

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

const parseScaleValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value !== 'string') return 0
  const num = parseFloat(value.trim())
  if (!Number.isFinite(num) || num <= 0) return 0
  return num
}

const getConfiguredContentScale = (video) => {
  if (!video || typeof video !== 'object') return 0

  const camera = video.camera && typeof video.camera === 'object' ? video.camera : null

  return parseScaleValue(
    camera?.contentScale ?? video.contentScale
  )
}

const activeVideoUrl = computed(() => getVideoUrl(props.activeVideo))
const isRealtimeImageStream = computed(() => isRealtimeStreamUrl(activeVideoUrl.value))
const configuredPlayerSize = computed(() => getConfiguredPlayerSize(props.activeVideo))
const configuredContentScale = computed(() => getConfiguredContentScale(props.activeVideo))
const playerWidth = ref(defaultPlayerWidth)
const playerHeight = ref(defaultPlayerHeight)
const resizing = ref(false)
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

const contentScale = ref(1)
const contentResizing = ref(false)
const contentResizeStart = ref({ x: 0, y: 0, scale: 1 })

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

const resetContentScaleFromConfig = () => {
  contentScale.value = configuredContentScale.value || defaultContentScale
}

watch([activeVideoUrl, configuredPlayerSize], resetPlayerSizeFromConfig, { immediate: true })
watch([activeVideoUrl, configuredContentScale], resetContentScaleFromConfig, { immediate: true })

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

// --- 内容缩放拖拽 ---
const stopContentResize = () => {
  if (!contentResizing.value) return
  contentResizing.value = false
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', handleContentResizeMove, true)
    window.removeEventListener('mouseup', stopContentResize, true)
    window.removeEventListener('touchmove', handleContentResizeTouchMove, { capture: true })
    window.removeEventListener('touchend', stopContentResize, true)
    window.removeEventListener('touchcancel', stopContentResize, true)
  }
}

const handleContentResizeMove = (event) => {
  if (!contentResizing.value) return
  const dx = event.clientX - contentResizeStart.value.x
  const dy = event.clientY - contentResizeStart.value.y
  // 右上角拖拽：向右放大，向上放大
  const baseDenominator = Math.max(playerWidth.value, playerHeight.value, 200)
  const scaleDelta = (dx - dy) / baseDenominator
  const nextScale = Math.max(0.5, Math.min(5, contentResizeStart.value.scale + scaleDelta))
  contentScale.value = Math.round(nextScale * 100) / 100
}

const handleContentResizeTouchMove = (event) => {
  if (!contentResizing.value) return
  const touch = event.touches?.[0]
  if (!touch) return
  const dx = touch.clientX - contentResizeStart.value.x
  const dy = touch.clientY - contentResizeStart.value.y
  const baseDenominator = Math.max(playerWidth.value, playerHeight.value, 200)
  const scaleDelta = (dx - dy) / baseDenominator
  const nextScale = Math.max(0.5, Math.min(5, contentResizeStart.value.scale + scaleDelta))
  contentScale.value = Math.round(nextScale * 100) / 100
}

const startContentResizeWithPoint = (x, y) => {
  contentResizing.value = true
  contentResizeStart.value = { x, y, scale: contentScale.value }
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', handleContentResizeMove, true)
    window.addEventListener('mouseup', stopContentResize, true)
    window.addEventListener('touchmove', handleContentResizeTouchMove, { capture: true, passive: false })
    window.addEventListener('touchend', stopContentResize, true)
    window.addEventListener('touchcancel', stopContentResize, true)
  }
}

const handleContentResizeMouseDown = (event) => {
  event.preventDefault?.()
  startContentResizeWithPoint(event.clientX, event.clientY)
}

const handleContentResizeTouchStart = (event) => {
  const touch = event.touches?.[0]
  if (!touch) return
  event.preventDefault?.()
  startContentResizeWithPoint(touch.clientX, touch.clientY)
}

onBeforeUnmount(() => {
  stopResize()
  stopContentResize()
})

const videoContainerStyle = computed(() => ({
  width: `${playerWidth.value}px`,
  height: `${playerHeight.value}px`,
  maxWidth: 'calc(100vw - 2rem)',
  maxHeight: 'calc(100vh - 2rem)',
  userSelect: resizing.value ? 'none' : '',
  overflow: 'hidden'
}))

const contentStyle = computed(() => ({
  transform: `scale(${contentScale.value})`,
  transformOrigin: 'center center',
  width: '100%',
  height: '100%'
}))

defineExpose({
  getPlayerSize: () => ({
    playerWidth: playerWidth.value,
    playerHeight: playerHeight.value,
    contentScale: contentScale.value
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
  height: 100% !important; /* 覆盖 Uni-App 默认的固定 225px 高度 */
}

:deep(uni-video video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain; /* 改为 contain 可以确保视频比例不被裁剪，若想强行铺满四周可用 cover */
}

.realtime-stream {
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

.content-resize-handle {
  position: absolute;
  right: -8px;
  top: -8px;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 9999px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  cursor: nesw-resize;
}
</style>
