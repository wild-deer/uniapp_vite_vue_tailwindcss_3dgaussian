<template>
  <view class="absolute top-20 right-4 bg-black/80 backdrop-blur-md p-6 rounded-lg max-w-md w-80 z-10">
    <view class="relative mb-3">
      <text class="text-white text-lg font-medium block">操作说明</text>
      <button
        @click="$emit('close')"
        class="absolute top-0 right-0 text-red-500 text-xl hover:text-red-400 transition-colors font-bold w-6 h-6 flex items-center justify-center"
      >
        ×
      </button>
    </view>

    <view class="space-y-4">
      <view>
        <text class="text-green-400 font-medium text-base block mb-3">鼠标操作</text>
        <view class="space-y-2">
          <view class="flex justify-between">
            <text class="text-gray-300 text-sm">左键双击</text>
            <text class="text-white text-sm">设置焦点</text>
          </view>
          <view class="flex justify-between">
            <text class="text-gray-300 text-sm">左键拖拽</text>
            <text class="text-white text-sm">围绕旋转</text>
          </view>
          <view class="flex justify-between">
            <text class="text-gray-300 text-sm">右键拖拽</text>
            <text class="text-white text-sm">平移视角</text>
          </view>
        </view>
      </view>

      <view>
        <text class="text-blue-400 font-medium text-base block mb-3">键盘操作</text>
        <view class="space-y-2">
          <view class="flex justify-between">
            <text class="text-gray-300 text-sm">I 键</text>
            <text class="text-white text-sm">显示调试信息</text>
          </view>
          <view class="flex justify-between">
            <text class="text-gray-300 text-sm">C 键</text>
            <text class="text-white text-sm">切换网格光标</text>
          </view>
          <view class="flex justify-between">
            <text class="text-gray-300 text-sm">U 键</text>
            <text class="text-white text-sm">切换控制方向标记</text>
          </view>
          <view class="flex justify-between">
            <text class="text-gray-300 text-sm">← 键</text>
            <text class="text-white text-sm">逆时针旋转相机</text>
          </view>
          <view class="flex justify-between">
            <text class="text-gray-300 text-sm">→ 键</text>
            <text class="text-white text-sm">顺时针旋转相机</text>
          </view>
          <view class="flex justify-between">
            <text class="text-gray-300 text-sm">P 键</text>
            <text class="text-white text-sm">切换点云模式</text>
          </view>
          <view class="flex justify-between">
            <text class="text-gray-300 text-sm">O 键</text>
            <text class="text-white text-sm">切换正交模式</text>
          </view>
          <view class="flex justify-between">
            <text class="text-gray-300 text-sm">= 键</text>
            <text class="text-white text-sm">增加泼溅缩放</text>
          </view>
          <view class="flex justify-between">
            <text class="text-gray-300 text-sm">- 键</text>
            <text class="text-white text-sm">减少泼溅缩放</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineEmits(['close'])
</script>

