<template>
  <view class="flex items-center justify-center relative p-4 bg-gray-900/80 backdrop-blur-md h-10">
    <button
      @click="$emit('back')"
      class="absolute left-4 flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
    >
      <text class="text-sm">←</text>
      <text>返回</text>
    </button>

    <text class="text-white text-lg font-medium">3D高斯场景</text>

    <view class="absolute right-4 flex items-center space-x-2!">
      <button
        @click="$emit('toggle-controls')"
        class="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
      >
        <text class="text-sm">?</text>
        <text>操作说明</text>
      </button>
      <!-- #ifdef H5 -->
      <button
        @click="$emit('reset-camera')"
        class="flex items-center space-x-1 px-2 py-1 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors text-sm"
      >
        <text class="text-sm">↺</text>
        <text>重置镜头</text>
      </button>
      <button
        v-if="isDevelopment"
        @click="$emit('copy-camera')"
        class="flex items-center space-x-1 px-2 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm"
      >
        <text class="text-sm">📷</text>
        <text>复制镜头</text>
      </button>

      <button
        v-if="isDevelopment"
        @click="$emit('log-memory')"
        class="flex items-center space-x-1 px-2 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
      >
        <text class="text-sm">📊</text>
        <text>内存</text>
      </button>
      <!-- #endif -->
    </view>
  </view>
</template>

<script setup>
defineProps({
  isDevelopment: {
    type: Boolean,
    default: false
  }
})

defineEmits(['back', 'toggle-controls', 'reset-camera', 'copy-camera', 'log-memory'])
</script>
