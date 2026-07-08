<template>
  <view class="flex items-center justify-center relative z-[2147483640] p-4 bg-slate-950/70 border-b border-cyan-500/20 backdrop-blur-xl h-12 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
    
    <!-- 左侧：返回按钮（极简科技线框） -->
    <view
    
      class="absolute left-4 h-3 flex items-center space-x-1 px-3 py-1 bg-transparent   text-slate-300 rounded-sm hover:border-cyan-500 hover:text-cyan-400 transition-all duration-300 text-sm tracking-wider shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]"
    >
      <image :src="logo1Url"  mode="aspectFit" />
    </view>

    <!-- 中间：主标题（科技感发光与字距偏宽） -->
    <view class="flex flex-col items-center select-none">
      <text class="text-cyan-400 text-base font-semibold tracking-widest drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] uppercase font-mono">
        3D 高斯场景
      </text>
      <text class="text-[9px] text-slate-500 tracking-wider -mt-0.5 font-mono">办公室</text>
    </view>

    <!-- 右侧：操作区 -->
    <view class="absolute right-4 flex items-center space-x-2!">
      <view
        v-if="cameraPickerOpen || worldTextPickerOpen"
        class="fixed inset-0 z-[2147483646]"
        @click="closeAllPickers"
      />

      <button
        v-if="playingVideo"
        @click="$emit('close-video')"
        class="flex items-center space-x-1 px-3 py-1 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-sm hover:bg-rose-500/20 hover:border-rose-400 transition-all duration-300 text-sm"
      >
        <text class="text-xs font-mono">×</text>
        <text class="font-light text-xs tracking-wide">退出</text>
      </button>
      <view v-if="cameraOptions.length" class="relative">
        <button
          @click="toggleCameraPicker"
          class="flex items-center space-x-1 px-3 py-1 bg-slate-900/50 border border-slate-700 text-slate-300 rounded-sm hover:border-cyan-500/50 hover:text-cyan-400 transition-all duration-300 text-sm"
        >
          <text class="text-xs font-mono">📷</text>
          <text class="font-light text-xs tracking-wide">虚实联动</text>
          <text
            class="text-xs font-mono opacity-70 transition-transform duration-200"
            :class="cameraPickerOpen ? 'rotate-180' : ''"
          >
            ▾
          </text>
        </button>
        <view
          v-if="cameraPickerOpen"
          class="absolute right-0 top-full mt-1 z-[2147483647] w-48 bg-slate-950/85 border border-slate-700 rounded-sm overflow-hidden backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.65)]"
        >
          <view
            v-for="(option, index) in cameraOptions"
            :key="index"
            class="flex items-center px-3 py-2 text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors duration-150 text-xs border-b border-slate-800 last:border-b-0"
            @click="selectCamera(index)"
          >
            <text class="w-6 text-[10px] font-mono opacity-60">{{ index + 1 }}</text>
            <text class="flex-1 truncate font-light tracking-wide">{{ option }}</text>
          </view>
        </view>
      </view>

      <button
        v-else
        @click="notifyNoCameras"
        class="flex items-center space-x-1 px-3 py-1 bg-slate-900/30 border border-slate-800 text-slate-500 rounded-sm text-sm"
      >
        <text class="text-xs font-mono">📷</text>
        <text class="font-light text-xs tracking-wide">镜头</text>
        <text class="text-xs font-mono opacity-50">▾</text>
      </button>

      <!-- 操作说明 -->
      <button
        @click="$emit('toggle-controls')"
        class="flex items-center space-x-1 px-3 py-1 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 rounded-sm hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-300 text-sm"
      >
        <text class="text-xs font-mono">[i]</text>
        <text class="font-light text-xs tracking-wide">指南</text>
      </button>

      <!-- #ifdef H5 -->
      <button
        @click="$emit('toggle-debug')"
        class="flex items-center space-x-1 px-3 py-1 bg-slate-900/50 border border-slate-700 text-slate-300 rounded-sm hover:border-cyan-500/50 hover:text-cyan-400 transition-all duration-300 text-sm"
      >
        <text class="text-xs font-mono">DBG</text>
        <text class="font-light text-xs tracking-wide">{{ debugMode ? '开' : '关' }}</text>
      </button>

      <button v-if="debugMode"
        @click="$emit('toggle-axes-helper')"
        class="flex items-center space-x-1 px-2 py-1 rounded-sm transition-all duration-300 text-sm"
        :class="showAxesHelper ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400' : 'bg-slate-900/50 border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'"
      >
        <text class="text-xs font-mono" >XYZ</text>
      </button>

      <button
        @click="$emit('toggle-irregular-cubes')"
        class="flex items-center space-x-1 px-2 py-1 rounded-sm transition-all duration-300 text-sm"
        :class="showIrregularCubes ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400' : 'bg-slate-900/50 border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'"
      >
        <text class="text-xs font-mono">遮罩</text>
      </button>

      <button
        v-if="debugMode && playingVideo"
        @click="$emit('copy-video-player-size')"
        class="flex items-center space-x-1 px-3 py-1 bg-slate-900/50 border border-slate-700 text-slate-300 rounded-sm hover:border-cyan-500/50 hover:text-cyan-400 transition-all duration-300 text-sm"
      >
        <text class="text-xs font-mono">📐</text>
        <text class="font-light text-xs tracking-wide">尺寸</text>
      </button>

      <SceneWorldTextPicker
        v-if="debugMode"
        v-model="worldTextPickerOpen"
        :options="worldTextOptions"
        :selected-index="selectedWorldTextIndex"
        :selected-angle="selectedWorldTextAngle"
        :selected-tilt-angle="selectedWorldTextTiltAngle"
        :selected-roll-angle="selectedWorldTextRollAngle"
        :selected-position="selectedWorldTextPosition"
        :selected-scale="selectedWorldTextScale"
        @select-world-text="$emit('select-world-text', $event)"
        @update-world-text-angle="$emit('update-world-text-angle', $event)"
        @update-world-text-tilt-angle="$emit('update-world-text-tilt-angle', $event)"
        @update-world-text-roll-angle="$emit('update-world-text-roll-angle', $event)"
        @update-world-text-position="$emit('update-world-text-position', $event)"
        @update-world-text-scale="$emit('update-world-text-scale', $event)"
        @copy-world-text="$emit('copy-world-text')"
      />

      <!-- 重置镜头 -->
      <button
        @click="$emit('reset-camera')"
        class="flex items-center space-x-1 px-3 py-1 bg-slate-900/50 border border-slate-700 text-slate-400 rounded-sm hover:border-cyan-500/50 hover:text-cyan-400 transition-all duration-300 text-sm"
      >
        <text class="text-xs font-mono">⟲</text>
        <text class="font-light text-xs tracking-wide">重置</text>
      </button>

      <!-- 复制镜头 (开发环境：采用更克制的半透明，移除高亮橙色) -->
      <button 
        v-if="debugMode"
        @click="$emit('copy-camera')"
        class="flex items-center justify-center w-8 h-7 bg-slate-900/50 border border-slate-800 text-amber-500/80 rounded-sm hover:border-amber-500/50 hover:text-amber-400 transition-all duration-300"
        title="复制镜头参数"
      >
        <text class="text-sm">📷</text>
      </button>

      <!-- 内存查看 (开发环境) -->
      <!-- <button
        v-if="isDevelopment"
        @click="$emit('log-memory')"
        class="flex items-center justify-center w-8 h-7 bg-slate-900/50 border border-slate-800 text-purple-400/80 rounded-sm hover:border-purple-500/50 hover:text-purple-400 transition-all duration-300"
        title="内存日志"
      >
        <text class="text-xs font-mono">内存</text>
      </button> -->
      <!-- #endif -->
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import logo1Url from '@/static/logo1.png'
import SceneWorldTextPicker from './SceneWorldTextPicker.vue'

const props = defineProps({
  isDevelopment: {
    type: Boolean,
    default: false
  },
  debugMode: {
    type: Boolean,
    default: false
  },
  playingVideo: {
    type: Boolean,
    default: false
  },
  videos: {
    type: Array,
    default: () => []
  },
  worldTextOptions: {
    type: Array,
    default: () => []
  },
  selectedWorldTextIndex: {
    type: Number,
    default: -1
  },
  selectedWorldTextAngle: {
    type: Number,
    default: 0
  },
  selectedWorldTextTiltAngle: {
    type: Number,
    default: 0
  },
  selectedWorldTextRollAngle: {
    type: Number,
    default: 0
  },
  selectedWorldTextPosition: {
    type: Array,
    default: () => []
  },
  selectedWorldTextScale: {
    type: Array,
    default: () => []
  },
  showAxesHelper: {
    type: Boolean,
    default: true
  },
  showIrregularCubes: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'back',
  'toggle-controls',
  'select-video',
  'toggle-debug',
  'select-world-text',
  'update-world-text-angle',
  'update-world-text-tilt-angle',
  'update-world-text-roll-angle',
  'update-world-text-position',
  'update-world-text-scale',
  'copy-world-text',
  'copy-video-player-size',
  'reset-camera',
  'close-video',
  'copy-camera',
  'log-memory',
  'toggle-axes-helper',
  'toggle-irregular-cubes'
])

const videoTitle = (video, index) => {
  if (!video) return `镜头 ${index + 1}`
  return video.title || video.name || `镜头 ${index + 1}`
}

const cameraOptions = computed(() =>
  (Array.isArray(props.videos) ? props.videos : []).map((video, index) => videoTitle(video, index))
)
const cameraPickerOpen = ref(false)
const worldTextPickerOpen = ref(false)

watch(cameraOptions, (options) => {
  if (!options?.length) cameraPickerOpen.value = false
})

const toggleCameraPicker = () => {
  if (!cameraOptions.value.length) return
  worldTextPickerOpen.value = false
  cameraPickerOpen.value = !cameraPickerOpen.value
}

const closeCameraPicker = () => {
  cameraPickerOpen.value = false
}

const closeAllPickers = () => {
  closeCameraPicker()
  worldTextPickerOpen.value = false
}

const selectCamera = (index) => {
  closeCameraPicker()
  const safeIndex = Number(index)
  if (!Number.isFinite(safeIndex) || safeIndex < 0) return
  const video = props.videos?.[safeIndex]
  if (!video) return
  emit('select-video', video)
}

const notifyNoCameras = () => {
  uni.showToast({
    title: '当前场景未配置镜头',
    icon: 'none'
  })
}
</script>

