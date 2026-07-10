<template>
  <view class="flex flex-col h-screen bg-black relative">
    <SceneNavbar
      :is-development="sceneStore.isDevelopment"
      :debug-mode="sceneStore.debugMode"
      :playing-video="sceneStore.playingVideo"
      :videos="availableVideos"
      :world-text-options="worldTextOptions"
      :selected-world-text-index="selectedWorldTextIndexValue"
      :selected-world-text-angle="selectedWorldTextAngleValue"
      :selected-world-text-tilt-angle="selectedWorldTextTiltAngleValue"
      :selected-world-text-roll-angle="selectedWorldTextRollAngleValue"
      :selected-world-text-position="selectedWorldTextPositionValue"
      :selected-world-text-scale="selectedWorldTextScaleValue"
      :show-axes-helper="sceneStore.showAxesHelper"
      :show-irregular-cubes="sceneStore.showIrregularCubes"
      @back="goBack"
      @toggle-controls="sceneStore.toggleControls"
      @select-video="selectVideo"
      @toggle-debug="toggleDebugMode"
      @select-world-text="selectWorldText"
      @update-world-text-angle="updateWorldTextAngle"
      @update-world-text-tilt-angle="updateWorldTextTiltAngle"
      @update-world-text-roll-angle="updateWorldTextRollAngle"
      @update-world-text-position="updateWorldTextPosition"
      @update-world-text-scale="updateWorldTextScale"
      @copy-world-text="copyWorldTextConfig"
      @copy-video-player-size="copyVideoPlayerSize"
      @reset-camera="resetCamera"
      @close-video="exitVideo"
      @switch-camera="switchVideoDuringPlayback"
      @copy-camera="copyCameraView"
      @log-memory="logMemoryUsage"
      @toggle-axes-helper="sceneStore.toggleAxesHelper"
      @toggle-irregular-cubes="sceneStore.toggleIrregularCubes"
      @update-video-offset="updateVideoOffset"
      @update-feather-enabled="updateFeatherEnabled"
      @update-feather-radius="updateFeatherRadius"
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
      v-if="!sceneStore.playingVideo && (sceneStore.loading || sceneStore.status !== '场景加载完成')" 
      class="absolute top-20 left-4 bg-black/70 backdrop-blur-md p-4 rounded-lg max-w-xs"
    >
      <text class="text-white text-sm">{{ sceneStore.status }}</text>
    </view>

    <!-- 操作说明面板 -->
    <SceneControlsPanel
      v-if="sceneStore.showControls"
      @close="sceneStore.toggleControls"
    />
    <SceneVideoModal
      ref="videoModalRef"
      :playing-video="sceneStore.playingVideo"
      :active-video="sceneStore.activeVideo"
      @close-video="exitVideo"
    />
  </view>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import SceneNavbar from './components/SceneNavbar.vue'
import SceneControlsPanel from './components/SceneControlsPanel.vue'
import SceneVideoModal from './components/SceneVideoModal.vue'
import { useSceneStore } from '../../stores/scene'
import { useSceneConfigLoader } from './composables/useSceneConfigLoader'
import { useSceneVideoPlayback } from './composables/useSceneVideoPlayback'
import { useSceneNavbarActions } from './composables/useSceneNavbarActions'

// #ifdef H5
import { useSceneViewer } from './composables/useSceneViewer'
// #endif

const sceneStore = useSceneStore()
const videoModalRef = ref(null)

let viewer
let initViewer
let performCompleteCleanup
let logMemoryUsage
let resetCameraView
let moveCameraToView
let setViewerInteractionLocked
let setWorldTextDebugEnabled
let copySelectedWorldText
let worldTextDebugOptions
let selectedWorldTextIndex
let selectedWorldTextAngle
let selectedWorldTextTiltAngle
let selectedWorldTextRollAngle
let selectedWorldTextPosition
let selectedWorldTextScale
let selectWorldTextByIndex
let setSelectedWorldTextAngle
let setSelectedWorldTextTiltAngle
let setSelectedWorldTextRollAngle
let setSelectedWorldTextPosition
let setSelectedWorldTextScale

// #ifdef H5
;({ viewer, initViewer, performCompleteCleanup, logMemoryUsage, resetCameraView, moveCameraToView, setViewerInteractionLocked, setWorldTextDebugEnabled, copySelectedWorldText, worldTextDebugOptions, selectedWorldTextIndex, selectedWorldTextAngle, selectedWorldTextTiltAngle, selectedWorldTextRollAngle, selectedWorldTextPosition, selectedWorldTextScale, selectWorldTextByIndex, setSelectedWorldTextAngle, setSelectedWorldTextTiltAngle, setSelectedWorldTextRollAngle, setSelectedWorldTextPosition, setSelectedWorldTextScale } =
  useSceneViewer(sceneStore))
// #endif

const { ensureSceneConfigReady } = useSceneConfigLoader(sceneStore)

const {
  availableVideos,
  selectVideo,
  closeVideo,
  cancelPendingVideoPlayback
} = useSceneVideoPlayback(sceneStore, { moveCameraToView, videoModalRef })

const {
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
} = useSceneNavbarActions(sceneStore, {
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

const cleanupScene = () => {
  cancelPendingVideoPlayback()
  sceneStore.stopVideoPlayback()
  sceneStore.setInteractionLocked(false)
  setViewerInteractionLocked?.(false)
  performCompleteCleanup?.()
}

onBeforeUnmount(() => {
  // 执行完美清理
  cleanupScene()
})

watch(
  () => [sceneStore.interactionLocked, sceneStore.debugMode],
  ([interactionLocked, debugMode]) => {
    setViewerInteractionLocked?.(!!interactionLocked && !debugMode)
    setWorldTextDebugEnabled?.(debugMode)
  },
  { immediate: true }
)

// 方法定义
const goBack = () => {
  // 在页面跳转前执行完美清理
  cleanupScene()
  
  uni.redirectTo({
    url: '/pages/index/index'
  })
}

const toggleDebugMode = () => {
  sceneStore.toggleDebugMode()
}

const switchVideoDuringPlayback = async (video) => {
  await exitVideo()
  selectVideo(video)
}
</script>
