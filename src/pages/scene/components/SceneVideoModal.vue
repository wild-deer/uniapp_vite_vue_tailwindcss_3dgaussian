<template>
  <!-- #ifdef H5 -->
  <!-- 
    修改点：
    - 去掉了 pt-16
    - 将 items-start 改为 items-center，实现垂直居中
    - justify-center 保持不变，实现水平居中
  -->
  <view
    v-if="playingVideo && activeVideo"
    class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
  >
    <!-- pointer-events-auto 恢复视频区域内部的点击事件 -->
    <view class="relative w-full max-w-5xl mx-4 pointer-events-auto">
      <video
        v-if="activeVideoUrl"
        :src="activeVideoUrl"
        class="w-full aspect-video! block bg-black shadow-xl "
        controls
        autoplay
        playsinline
      />
    </view>
  </view>
  <!-- #endif -->
</template>

<script setup>
import { computed } from 'vue'

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
  return value.trim()
}

const getVideoUrl = (video) => {
  if (!video) return ''
  if (typeof video === 'string') return normalizeVideoUrl(video)
  return normalizeVideoUrl(video.url || video.videoUrl || video.src)
}

const activeVideoUrl = computed(() => getVideoUrl(props.activeVideo))
</script>

<style scoped>
/* 
  针对 Uni-App H5 端特别修复：
  既然确定了是 16:9，我们需要确保外层包裹标签 <uni-video> 以及内部的原生 <video> 
  都严格遵循 16:9 的纵横比，避免因为默认高度（如 225px 或 150px）导致画面拉伸或两侧留黑边。
*/
:deep(uni-video) {
  width: 100% !important;
  aspect-ratio: 16 / 9 !important;
  height: auto !important; /* 覆盖 Uni-App 默认的固定 225px 高度 */
}
:deep(uni-video video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain; /* 改为 contain 可以确保视频比例不被裁剪，若想强行铺满四周可用 cover */
}
</style>