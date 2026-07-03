<template>
  <view class="flex flex-col gap-2">
    <view class="flex items-center justify-between">
      <text class="text-[11px] font-light tracking-wide text-slate-300">{{ label }}</text>
      <text class="text-[10px] font-mono text-cyan-300">{{ displayValue }}</text>
    </view>
    <slider
      class="w-full"
      :disabled="disabled"
      :min="sliderMin"
      :max="sliderMax"
      :step="sliderStep"
      :value="sliderValue"
      activeColor="#22d3ee"
      backgroundColor="rgba(71, 85, 105, 0.5)"
      block-color="#67e8f9"
      :block-size="14"
      @changing="handleSliderChanging"
      @change="handleSliderChange"
    />
    <view class="flex items-center justify-between text-[9px] font-mono text-slate-500">
      <text>{{ minLabel }}</text>
      <text>{{ maxLabel }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const SCALE_FACTOR = 1000

const props = defineProps({
  label: {
    type: String,
    default: '角度'
  },
  modelValue: {
    type: Number,
    default: 0
  },
  min: {
    type: Number,
    default: -Math.PI
  },
  max: {
    type: Number,
    default: Math.PI
  },
  step: {
    type: Number,
    default: 0.01
  },
  precision: {
    type: Number,
    default: 3
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const toSliderNumber = (value) => Math.round((Number(value) || 0) * SCALE_FACTOR)
const fromSliderNumber = (value) => (Number(value) || 0) / SCALE_FACTOR

const formatNumber = (value) => Number(value || 0).toFixed(props.precision)

const sliderMin = computed(() => toSliderNumber(props.min))
const sliderMax = computed(() => toSliderNumber(props.max))
const sliderStep = computed(() => Math.max(1, toSliderNumber(props.step)))
const sliderValue = computed(() => toSliderNumber(props.modelValue))
const displayValue = computed(() => `${formatNumber(props.modelValue)} rad`)
const minLabel = computed(() => `${formatNumber(props.min)} rad`)
const maxLabel = computed(() => `${formatNumber(props.max)} rad`)

const emitSliderValue = (detailValue) => {
  const nextValue = fromSliderNumber(detailValue)
  emit('update:modelValue', nextValue)
  return nextValue
}

const handleSliderChanging = (event) => {
  emitSliderValue(event?.detail?.value)
}

const handleSliderChange = (event) => {
  const nextValue = emitSliderValue(event?.detail?.value)
  emit('change', nextValue)
}
</script>
