<template>
  <view
    class="flex items-center justify-center absolute left-0 right-0 z-[2147483640] p-4 bg-slate-950/70 backdrop-blur-xl h-12 shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
    :class="navbarDirection === 'bottom' ? 'border-t border-cyan-500/20' : 'border-b border-cyan-500/20'"
    :style="navbarPositionStyle"
  >
    
    <!-- 左侧：返回按钮（极简科技线框） -->
    <view
    
      class="absolute left-4 h-3 flex items-center space-x-1 px-3 py-1 bg-transparent   text-slate-300 rounded-sm hover:border-cyan-500 hover:text-cyan-400 transition-all duration-300 text-sm tracking-wider shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]"
    >
      <image :src="logo1Url"  mode="aspectFit" class="w-50 " />
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
        v-if="cameraPickerOpen || worldTextPickerOpen || videoPositionPickerOpen"
        class="fixed inset-0 z-[2147483646]"
        @click="closeAllPickers"
      />

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

      <!-- 视频位置控制 -->
      <view v-if="debugMode && playingVideo" class="relative">
        <button
          @click="toggleVideoPositionPicker"
          class="flex items-center space-x-1 px-3 py-1 bg-slate-900/50 border border-slate-700 text-slate-300 rounded-sm hover:border-cyan-500/50 hover:text-cyan-400 transition-all duration-300 text-sm"
        >
          <text class="text-xs font-mono">📍</text>
          <text class="font-light text-xs tracking-wide">视频裁剪</text>
          <text
            class="text-xs font-mono opacity-70 transition-transform duration-200"
            :class="videoPositionPickerOpen ? 'rotate-180' : ''"
          >
            ▾
          </text>
        </button>
        <view
          v-if="videoPositionPickerOpen"
          class="absolute right-0 top-full mt-1 z-[2147483647] w-44 bg-slate-950/85 border border-slate-700 rounded-sm overflow-hidden backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.65)]"
        >
          <view class="p-3 flex flex-col gap-2">
            <text class="text-[11px] font-mono tracking-wide text-cyan-300">视频裁剪 (px)</text>
            <view
              v-for="edge in videoPositionEdges"
              :key="edge.key"
              class="flex items-center justify-between gap-2"
            >
              <text class="text-[10px] font-mono text-slate-400 w-8">{{ edge.label }}</text>
              <input
                :value="videoPositionInputs[edge.key]"
                :placeholder="'0'"
                placeholder-class="scene-debug-input-placeholder"
                class="flex-1 h-7 px-2 text-[11px] font-mono text-slate-200 bg-slate-900/70 border border-slate-700 rounded-sm focus:border-cyan-500/50"
                @input="handleVideoPositionInput(edge.key, $event)"
                @confirm="submitVideoPosition(edge.key)"
                @blur="submitVideoPosition(edge.key)"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 羽化控制 -->
      <view v-if="debugMode && playingVideo" class="relative">
        <button
          @click="toggleFeatherPicker"
          class="flex items-center space-x-1 px-3 py-1 rounded-sm transition-all duration-300 text-sm"
          :class="featherEnabled ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20' : 'bg-slate-900/50 border border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400'"
        >
          <text class="text-xs font-mono">🌫️</text>
          <text class="font-light text-xs tracking-wide">羽化</text>
          <text
            class="text-xs font-mono opacity-70 transition-transform duration-200"
            :class="featherPickerOpen ? 'rotate-180' : ''"
          >
            ▾
          </text>
        </button>
        <view
          v-if="featherPickerOpen"
          class="absolute right-0 top-full mt-1 z-[2147483647] w-44 bg-slate-950/85 border border-slate-700 rounded-sm overflow-hidden backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.65)]"
        >
          <view class="p-3 flex flex-col gap-3">
            <text class="text-[11px] font-mono tracking-wide text-cyan-300">边缘羽化</text>
            <view class="flex items-center justify-between">
              <text class="text-[10px] font-mono text-slate-400">启用</text>
              <view
                class="w-9 h-5 rounded-full cursor-pointer transition-colors duration-200"
                :class="featherEnabled ? 'bg-cyan-500' : 'bg-slate-700'"
                @click="toggleFeatherEnabled"
              >
                <view
                  class="w-3.5 h-3.5 bg-white rounded-full mt-0.5 transition-transform duration-200"
                  :class="featherEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'"
                />
              </view>
            </view>
            <view class="flex items-center justify-between gap-2">
              <text class="text-[10px] font-mono text-slate-400">半径 %</text>
              <input
                :value="featherRadiusInput"
                placeholder="30"
                placeholder-class="scene-debug-input-placeholder"
                class="w-16 h-7 px-2 text-[11px] font-mono text-slate-200 bg-slate-900/70 border border-slate-700 rounded-sm focus:border-cyan-500/50 text-center"
                @input="handleFeatherRadiusInput($event)"
                @confirm="submitFeatherRadius"
                @blur="submitFeatherRadius"
              />
            </view>
          </view>
        </view>
      </view>

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
  navbarPosition: {
    type: String,
    default: 'top'
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
  'close-video',
  'switch-camera',
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
  'copy-camera',
  'log-memory',
  'toggle-axes-helper',
  'toggle-irregular-cubes',
  'update-video-offset',
  'update-feather-enabled',
  'update-feather-radius'
])

const parseNavbarPosition = (raw) => {
  if (!raw || typeof raw !== 'string') return { direction: 'top', offset: 0 }
  const trimmed = raw.trim()
  // 匹配 'top' / 'bottom' / 'top-50' / 'bottom-20' 等格式
  const match = trimmed.match(/^(top|bottom)(?:-(\d+))?$/)
  if (!match) return { direction: 'top', offset: 0 }
  return {
    direction: match[1],
    offset: match[2] !== undefined ? parseInt(match[2], 10) : 0
  }
}

const navbarDirection = computed(() => parseNavbarPosition(props.navbarPosition).direction)
const navbarOffset = computed(() => parseNavbarPosition(props.navbarPosition).offset)
const navbarPositionStyle = computed(() => {
  const dir = navbarDirection.value
  const offset = navbarOffset.value
  return {
    [dir]: `${offset}px`,
    [dir === 'top' ? 'bottom' : 'top']: 'auto'
  }
})

const videoTitle = (video, index) => {
  if (!video) return `镜头 ${index + 1}`
  return video.title || video.name || `镜头 ${index + 1}`
}

const cameraOptions = computed(() =>
  (Array.isArray(props.videos) ? props.videos : []).map((video, index) => videoTitle(video, index))
)
const cameraPickerOpen = ref(false)
const worldTextPickerOpen = ref(false)
const videoPositionPickerOpen = ref(false)
const featherPickerOpen = ref(false)

watch(cameraOptions, (options) => {
  if (!options?.length) cameraPickerOpen.value = false
})

const toggleCameraPicker = () => {
  if (!cameraOptions.value.length) return
  worldTextPickerOpen.value = false
  videoPositionPickerOpen.value = false
  featherPickerOpen.value = false
  cameraPickerOpen.value = !cameraPickerOpen.value
}

const closeCameraPicker = () => {
  cameraPickerOpen.value = false
}

const closeAllPickers = () => {
  closeCameraPicker()
  worldTextPickerOpen.value = false
  videoPositionPickerOpen.value = false
  featherPickerOpen.value = false
}

const videoPositionEdges = [
  { key: 'top', label: '上' },
  { key: 'right', label: '右' },
  { key: 'bottom', label: '下' },
  { key: 'left', label: '左' }
]

const videoPositionInputs = ref({
  top: '',
  right: '',
  bottom: '',
  left: ''
})

const toggleVideoPositionPicker = () => {
  cameraPickerOpen.value = false
  worldTextPickerOpen.value = false
  featherPickerOpen.value = false
  videoPositionPickerOpen.value = !videoPositionPickerOpen.value
}

const resolveVideoPositionInputValue = (event) => {
  if (typeof event === 'string') return event
  if (typeof event?.detail?.value === 'string') return event.detail.value
  if (typeof event?.target?.value === 'string') return event.target.value
  return ''
}

const handleVideoPositionInput = (edge, event) => {
  videoPositionInputs.value = {
    ...videoPositionInputs.value,
    [edge]: resolveVideoPositionInputValue(event)
  }
}

const submitVideoPosition = (edge) => {
  const raw = String(videoPositionInputs.value[edge] ?? '').trim()
  if (!raw) return
  const numValue = Number(raw)
  if (!Number.isFinite(numValue)) {
    uni.showToast({ title: '请输入有效数字', icon: 'none' })
    return
  }
  emit('update-video-offset', { edge, value: numValue })
}

// --- 羽化控制 ---
const featherEnabled = ref(false)
const featherRadiusInput = ref('30')

const toggleFeatherPicker = () => {
  cameraPickerOpen.value = false
  worldTextPickerOpen.value = false
  videoPositionPickerOpen.value = false
  featherPickerOpen.value = !featherPickerOpen.value
}

const toggleFeatherEnabled = () => {
  featherEnabled.value = !featherEnabled.value
  emit('update-feather-enabled', featherEnabled.value)
}

const handleFeatherRadiusInput = (event) => {
  const raw = resolveVideoPositionInputValue(event)
  featherRadiusInput.value = raw
}

const submitFeatherRadius = () => {
  const raw = String(featherRadiusInput.value ?? '').trim()
  if (!raw) return
  const num = Number(raw)
  if (!Number.isFinite(num) || num <= 0 || num >= 100) {
    uni.showToast({ title: '请输入 1-99 的数值', icon: 'none' })
    return
  }
  featherRadiusInput.value = String(num)
  emit('update-feather-radius', num)
}

const selectCamera = (index) => {
  closeCameraPicker()
  const safeIndex = Number(index)
  if (!Number.isFinite(safeIndex) || safeIndex < 0) return
  const video = props.videos?.[safeIndex]
  if (!video) return

  if (props.playingVideo) {
    emit('switch-camera', video)
  } else {
    emit('select-video', video)
  }
}

const notifyNoCameras = () => {
  uni.showToast({
    title: '当前场景未配置镜头',
    icon: 'none'
  })
}
</script>

