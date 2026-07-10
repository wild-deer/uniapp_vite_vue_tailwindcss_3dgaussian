<template>
  <!-- 相机镜头列表：绝对定位，始终显示 -->
  <view
    v-if="cameraOptions.length"
    class="absolute top-[calc(1rem+130px)] right-4 z-[2147483647] w-48 bg-slate-950/85 border border-slate-700 rounded-sm overflow-hidden backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.65)]"
  >
    <view
      v-for="(option, index) in cameraOptions"
      :key="index"
      class="flex items-center px-3 py-2 text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors duration-150 text-xs border-b border-slate-800 last:border-b-0"
      @click="selectCamera(index)"
    >
      <!-- <text class="w-6 text-[10px] font-mono opacity-60">{{ index + 1 }}</text> -->
      <text class="flex-1 truncate font-light tracking-wide">{{ option }}</text>
    </view>
    <!-- 退出按钮 -->
    <button
      v-if="playingVideo"
      class="bg-slate-950/85 flex items-center space-x-1 w-full px-3 py-2 text-rose-300 hover:bg-rose-500/10 transition-colors duration-150 text-xs border-t border-slate-800"
      @click="$emit('close-video')"
    >
      <text class="text-xs font-mono">×</text>
      <text class="font-light text-xs tracking-wide">退出</text>
    </button>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  playingVideo: {
    type: Boolean,
    default: false
  },
  videos: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select-video', 'close-video'])

const videoTitle = (video, index) => {
  if (!video) return `镜头 ${index + 1}`
  return video.title || video.name || `镜头 ${index + 1}`
}

const cameraOptions = computed(() =>
  (Array.isArray(props.videos) ? props.videos : []).map((video, index) => videoTitle(video, index))
)

const selectCamera = (index) => {
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
</script>

