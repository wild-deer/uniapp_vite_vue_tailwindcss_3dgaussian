<template>
  <!-- #ifdef H5 -->
  <!-- 
    修改点：
    - 去掉了 pt-16
    - 将 items-start 改为 items-center，实现垂直居中
    - justify-center 保持不变，实现水平居中
  -->
  <!-- activeVideo 一旦设置就挂载 DOM 开始加载视频流，playingVideo 控制可见性 -->
  <view
    v-if="activeVideo"
    class="fixed inset-0 z-50 flex items-center justify-center"
    :class="{ 'pointer-events-none': !playingVideo }"
  >
    <view
      class="relative video-modal-panel transition-opacity duration-1000"
      :class="{
        'opacity-0 pointer-events-none': !playingVideo,
        'pointer-events-auto': playingVideo,
        'feather-active': featherEnabled
      }"
      :style="videoContainerStyle"
    >
      <view class="content-layer" :style="contentStyle">
        <img
          ref="imgRef"
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
      <button
        v-if="playingVideo"
        @click="$emit('close-video')"
        :style="closeBtnStyle"
        class="absolute z-10 w-7 h-7 flex items-center justify-center bg-slate-900/50 border border-slate-500/30 text-slate-300 rounded-sm hover:bg-slate-500/20 hover:border-slate-400 transition-all duration-300"
      >
        <text class="text-sm font-mono leading-none">×</text>
      </button>
      <view
        v-if="playingVideo"
        class="resize-handle"
        :style="resizeHandleStyle"
        @mousedown.stop="handleResizeMouseDown"
        @touchstart.stop="handleResizeTouchStart"
      />
      <view
        v-if="playingVideo"
        class="content-resize-handle"
        :style="contentResizeHandleStyle"
        @mousedown.stop="handleContentResizeMouseDown"
        @touchstart.stop="handleContentResizeTouchStart"
      />
    </view>
  </view>
  <!-- #endif -->
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const emit = defineEmits(['close-video'])

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

const getConfiguredClipOffsets = (video) => {
  if (!video || typeof video !== 'object') return { top: 0, right: 0, bottom: 0, left: 0 }

  const camera = video.camera && typeof video.camera === 'object' ? video.camera : null

  return {
    top: camera?.clipTop ?? video.clipTop ?? 0,
    right: camera?.clipRight ?? video.clipRight ?? 0,
    bottom: camera?.clipBottom ?? video.clipBottom ?? 0,
    left: camera?.clipLeft ?? video.clipLeft ?? 0
  }
}

const getConfiguredFeatherEdge = (video) => {
  if (!video || typeof video !== 'object') return false
  const camera = video.camera && typeof video.camera === 'object' ? video.camera : null
  const value = camera?.featherEdge ?? video.featherEdge
  return value === true || value === 'true'
}

const getConfiguredFeatherRadius = (video) => {
  if (!video || typeof video !== 'object') return 30
  const camera = video.camera && typeof video.camera === 'object' ? video.camera : null
  const value = camera?.featherRadius ?? video.featherRadius
  if (typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 100) return value
  return 30
}

const activeVideoUrl = computed(() => getVideoUrl(props.activeVideo))
const isRealtimeImageStream = computed(() => isRealtimeStreamUrl(activeVideoUrl.value))
const configuredPlayerSize = computed(() => getConfiguredPlayerSize(props.activeVideo))
const configuredContentScale = computed(() => getConfiguredContentScale(props.activeVideo))
const configuredClipOffsets = computed(() => getConfiguredClipOffsets(props.activeVideo))
const configuredFeatherEdge = computed(() => getConfiguredFeatherEdge(props.activeVideo))
const configuredFeatherRadius = computed(() => getConfiguredFeatherRadius(props.activeVideo))
const imgRef = ref(null)
const playerWidth = ref(defaultPlayerWidth)
const playerHeight = ref(defaultPlayerHeight)
const resizing = ref(false)
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

const contentScale = ref(1)
const contentResizing = ref(false)
const contentResizeStart = ref({ x: 0, y: 0, scale: 1 })

// 视频面板边缘裁剪 (debug模式下可独立控制四边)
const offsetTop = ref(0)
const offsetRight = ref(0)
const offsetBottom = ref(0)
const offsetLeft = ref(0)

// 边缘羽化
const featherEnabled = ref(false)
const featherRadius = ref(30)

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

const resetClipOffsetsFromConfig = () => {
  const offsets = configuredClipOffsets.value
  offsetTop.value = offsets.top
  offsetRight.value = offsets.right
  offsetBottom.value = offsets.bottom
  offsetLeft.value = offsets.left
}

const resetFeatherFromConfig = () => {
  featherEnabled.value = configuredFeatherEdge.value
  featherRadius.value = configuredFeatherRadius.value
}

watch([activeVideoUrl, configuredPlayerSize], resetPlayerSizeFromConfig, { immediate: true })
watch([activeVideoUrl, configuredContentScale], resetContentScaleFromConfig, { immediate: true })
watch([activeVideoUrl, configuredClipOffsets], resetClipOffsetsFromConfig, { immediate: true })
watch([activeVideoUrl, configuredFeatherEdge, configuredFeatherRadius], resetFeatherFromConfig, { immediate: true })

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
  // 左上角拖拽：向左放大，向上放大
  const baseDenominator = Math.max(playerWidth.value, playerHeight.value, 200)
  const scaleDelta = (-dx - dy) / baseDenominator
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
  const scaleDelta = (-dx - dy) / baseDenominator
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

const videoContainerStyle = computed(() => {
  const style = {
    width: `${playerWidth.value}px`,
    height: `${playerHeight.value}px`,
    maxWidth: 'calc(100vw - 2rem)',
    maxHeight: 'calc(100vh - 2rem)',
    userSelect: resizing.value ? 'none' : '',
    overflow: 'hidden'
  }
  const hasOffset = offsetTop.value || offsetRight.value || offsetBottom.value || offsetLeft.value
  if (hasOffset) {
    style.clipPath = `inset(${offsetTop.value}px ${offsetRight.value}px ${offsetBottom.value}px ${offsetLeft.value}px)`
  }
  if (featherEnabled.value) {
    const r = featherRadius.value
    const w = playerWidth.value || 1
    const h = playerHeight.value || 1

    // 将裁剪偏移量转为百分比，使羽化渐变基于裁剪后的可视区域
    const leftPct = (offsetLeft.value / w) * 100
    const rightPct = (offsetRight.value / w) * 100
    const topPct = (offsetTop.value / h) * 100
    const bottomPct = (offsetBottom.value / h) * 100

    const hGrad = `linear-gradient(to right, transparent 0%, transparent ${leftPct}%, black ${leftPct + r}%, black ${100 - rightPct - r}%, transparent ${100 - rightPct}%, transparent 100%)`
    const vGrad = `linear-gradient(to bottom, transparent 0%, transparent ${topPct}%, black ${topPct + r}%, black ${100 - bottomPct - r}%, transparent ${100 - bottomPct}%, transparent 100%)`

    style.WebkitMaskImage = `${hGrad}, ${vGrad}`
    style.WebkitMaskComposite = 'source-in'
    style.maskImage = `${hGrad}, ${vGrad}`
    style.maskComposite = 'intersect'
  }
  return style
})

const contentStyle = computed(() => ({
  transform: `scale(${contentScale.value})`,
  transformOrigin: 'center center',
  width: '100%',
  height: '100%'
}))

// 三个按钮根据裁剪偏移量动态调整位置，使其始终出现在可视区域边缘
const closeBtnStyle = computed(() => ({
  top: `${offsetTop.value + 8}px`,
  right: `${offsetRight.value + 8}px`
}))

const resizeHandleStyle = computed(() => ({
  right: `${offsetRight.value - 8}px`,
  bottom: `${offsetBottom.value - 8}px`
}))

const contentResizeHandleStyle = computed(() => ({
  left: `${offsetLeft.value - 8}px`,
  top: `${offsetTop.value - 8}px`
}))

const cleanupStream = () => {
  if (imgRef.value && isRealtimeImageStream.value) {
    imgRef.value.src = ''
  }
  if (imgRef.value) {
    imgRef.value.removeAttribute('src')
  }
}

defineExpose({
  cleanupStream,
  getPlayerSize: () => ({
    playerWidth: playerWidth.value,
    playerHeight: playerHeight.value,
    contentScale: contentScale.value,
    clipTop: offsetTop.value,
    clipRight: offsetRight.value,
    clipBottom: offsetBottom.value,
    clipLeft: offsetLeft.value,
    featherEdge: featherEnabled.value,
    featherRadius: featherRadius.value
  }),
  getVideoOffsets: () => ({
    offsetTop: offsetTop.value,
    offsetRight: offsetRight.value,
    offsetBottom: offsetBottom.value,
    offsetLeft: offsetLeft.value
  }),
  setVideoOffset: (edge, value) => {
    const numValue = Number(value)
    if (!Number.isFinite(numValue)) return
    switch (edge) {
      case 'top': offsetTop.value = numValue; break
      case 'right': offsetRight.value = numValue; break
      case 'bottom': offsetBottom.value = numValue; break
      case 'left': offsetLeft.value = numValue; break
    }
  },
  setFeatherEnabled: (enabled) => {
    featherEnabled.value = !!enabled
  },
  setFeatherRadius: (value) => {
    const num = Number(value)
    if (Number.isFinite(num) && num > 0 && num < 100) {
      featherRadius.value = num
    }
  }
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
  /* 强制开启 GPU 硬件加速 */
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}

.video-modal-panel {
  transition: opacity 1s ease, transform 1s ease;
}

/* 羽化 mask 由 videoContainerStyle 内联样式动态注入，此处不设静态值 */

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
  left: -8px;
  top: -8px;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 9999px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  cursor: nwse-resize;
}

/* 视频面板内阴影羽化：作为 mask 不生效时的兜底方案 */
.video-modal-panel.feather-active::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  box-shadow: inset 0 0 120px 60px rgba(0, 0, 0, 0.6);
  border-radius: 4px;
}
</style>
