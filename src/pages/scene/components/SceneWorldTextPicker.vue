<template>
  <view class="relative">
    <button
      @click="toggle"
      class="flex items-center space-x-1 px-3 py-1 bg-cyan-950/35 border border-cyan-500/25 text-cyan-300 rounded-sm hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-300 text-sm"
      :class="!options.length ? 'opacity-60' : ''"
    >
      <text class="text-xs font-mono">TXT</text>
      <text class="font-light text-xs tracking-wide max-w-28 truncate">{{ selectedLabel }}</text>
      <text
        class="text-xs font-mono opacity-70 transition-transform duration-200"
        :class="modelValue ? 'rotate-180' : ''"
      >
        ▾
      </text>
    </button>
    <view
      v-if="modelValue"
      class="absolute right-0 top-full mt-1 z-[2147483647] w-72 bg-slate-950/90 border border-cyan-500/20 rounded-sm overflow-hidden backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.65)]"
    >
      <view v-if="options.length" class="p-3 flex flex-col gap-3">
        <view class="flex items-center justify-between">
          <text class="text-[11px] font-mono tracking-wide text-cyan-300">标牌调试</text>
          <button
            @click="$emit('copy-world-text')"
            class="px-2 py-1 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/25 rounded-sm hover:bg-cyan-500/20"
          >
            复制参数
          </button>
        </view>
        <view class="border border-slate-800 rounded-sm overflow-hidden max-h-44">
          <view
            v-for="option in options"
            :key="option.index"
            class="flex items-center px-3 py-2 text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors duration-150 text-xs border-b border-slate-800 last:border-b-0"
            :class="Number(selectedIndex) === Number(option.index) ? 'bg-cyan-500/10 text-cyan-300' : ''"
            @click="select(option.index)"
          >
            <text class="w-6 text-[10px] font-mono opacity-60">{{ Number(option.index) + 1 }}</text>
            <text class="flex-1 truncate font-light tracking-wide">{{ option.label }}</text>
          </view>
        </view>
        <SceneDebugSlider
          label="旋转角度"
          :model-value="selectedAngle"
          :disabled="selectedIndex < 0"
          :min="-3.14159"
          :max="3.14159"
          :step="0.01"
          :precision="3"
          @update:model-value="updateAngle"
        />
        <SceneDebugSlider
          label="垂直旋转"
          :model-value="selectedTiltAngle"
          :disabled="selectedIndex < 0"
          :min="-1.5708"
          :max="1.5708"
          :step="0.01"
          :precision="3"
          @update:model-value="updateTiltAngle"
        />
        <SceneDebugSlider
          label="第三轴旋转"
          :model-value="selectedRollAngle"
          :disabled="selectedIndex < 0"
          :min="-3.14159"
          :max="3.14159"
          :step="0.01"
          :precision="3"
          @update:model-value="updateRollAngle"
        />
        <view class="flex flex-col gap-1">
          <text class="text-[11px] font-mono tracking-wide text-cyan-300/90">位置</text>
          <view class="grid grid-cols-3 gap-2">
            <input
              v-for="(axis, i) in ['X', 'Y', 'Z']"
              :key="axis"
              :value="positionInputs[i]"
              :disabled="selectedIndex < 0"
              :placeholder="axis"
              placeholder-class="scene-debug-input-placeholder"
              class="h-8 px-2 text-[11px] font-mono text-slate-200 bg-slate-900/70 border border-slate-700 rounded-sm focus:border-cyan-500/50"
              @input="handlePositionInput(i, $event)"
              @confirm="submitPosition"
              @blur="submitPosition"
            />
          </view>
        </view>
        <view class="flex flex-col gap-1">
          <text class="text-[11px] font-mono tracking-wide text-cyan-300/90">缩放</text>
          <view class="grid grid-cols-3 gap-2">
            <input
              v-for="(axis, i) in ['X', 'Y', 'Z']"
              :key="axis"
              :value="scaleInputs[i]"
              :disabled="selectedIndex < 0"
              :placeholder="axis"
              placeholder-class="scene-debug-input-placeholder"
              class="h-8 px-2 text-[11px] font-mono text-slate-200 bg-slate-900/70 border border-slate-700 rounded-sm focus:border-cyan-500/50"
              @input="handleScaleInput(i, $event)"
              @confirm="submitScale"
              @blur="submitScale"
            />
          </view>
        </view>
      </view>
      <view v-else class="px-3 py-4 text-xs text-slate-500">
        当前场景未配置标牌
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import SceneDebugSlider from './SceneDebugSlider.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  options: {
    type: Array,
    default: () => []
  },
  selectedIndex: {
    type: Number,
    default: -1
  },
  selectedAngle: {
    type: Number,
    default: 0
  },
  selectedTiltAngle: {
    type: Number,
    default: 0
  },
  selectedRollAngle: {
    type: Number,
    default: 0
  },
  selectedPosition: {
    type: Array,
    default: () => []
  },
  selectedScale: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:modelValue',
  'select-world-text',
  'update-world-text-angle',
  'update-world-text-tilt-angle',
  'update-world-text-roll-angle',
  'update-world-text-position',
  'update-world-text-scale',
  'copy-world-text'
])

const positionInputs = ref(['', '', ''])
const scaleInputs = ref(['', '', ''])

const selectedLabel = computed(() => {
  const selected = (Array.isArray(props.options) ? props.options : []).find(
    (option) => Number(option?.index) === Number(props.selectedIndex)
  )
  return selected?.label || '选择标牌'
})

const formatValue = (value) => {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return '0'
  return numberValue.toFixed(5).replace(/\.?0+$/, '')
}

const selectedPositionValues = computed(() => {
  const position = Array.isArray(props.selectedPosition) ? props.selectedPosition : []
  if (position.length < 3) return ['0', '0', '0']
  return position.slice(0, 3).map((value) => formatValue(value))
})

const selectedScaleValues = computed(() => {
  const scale = Array.isArray(props.selectedScale) ? props.selectedScale : []
  if (scale.length < 3) return ['1', '1', '1']
  return scale.slice(0, 3).map((value) => formatValue(value))
})

const resolveInputValue = (event) => {
  if (typeof event === 'string') return event
  if (typeof event?.detail?.value === 'string') return event.detail.value
  if (typeof event?.target?.value === 'string') return event.target.value
  return ''
}

const syncPositionInputs = () => {
  positionInputs.value = [...selectedPositionValues.value]
}

const syncScaleInputs = () => {
  scaleInputs.value = [...selectedScaleValues.value]
}

watch(
  () => [props.selectedIndex, ...(Array.isArray(props.selectedPosition) ? props.selectedPosition : [])],
  () => { syncPositionInputs() },
  { immediate: true }
)

watch(
  () => [props.selectedIndex, ...(Array.isArray(props.selectedScale) ? props.selectedScale : [])],
  () => { syncScaleInputs() },
  { immediate: true }
)

const toggle = () => {
  if (!props.options?.length) return
  const next = !props.modelValue
  emit('update:modelValue', next)
}

const select = (index) => {
  emit('update:modelValue', false)
  emit('select-world-text', Number(index))
}

const updateAngle = (value) => {
  emit('update-world-text-angle', Number(value) || 0)
}

const updateTiltAngle = (value) => {
  emit('update-world-text-tilt-angle', Number(value) || 0)
}

const updateRollAngle = (value) => {
  emit('update-world-text-roll-angle', Number(value) || 0)
}

const handlePositionInput = (axisIndex, event) => {
  const nextValue = resolveInputValue(event)
  const nextInputs = [...positionInputs.value]
  nextInputs[axisIndex] = nextValue
  positionInputs.value = nextInputs
}

const handleScaleInput = (axisIndex, event) => {
  const nextValue = resolveInputValue(event)
  const nextInputs = [...scaleInputs.value]
  nextInputs[axisIndex] = nextValue
  scaleInputs.value = nextInputs
}

const submitPosition = () => {
  if (props.selectedIndex < 0) {
    syncPositionInputs()
    return
  }
  const parsed = positionInputs.value.map((value) => {
    const normalized = String(value ?? '').trim()
    if (!normalized) return NaN
    return Number(normalized)
  })
  if (parsed.some((value) => !Number.isFinite(value))) {
    uni.showToast({ title: '请输入有效的 X/Y/Z', icon: 'none' })
    syncPositionInputs()
    return
  }
  emit('update-world-text-position', parsed)
}

const submitScale = () => {
  if (props.selectedIndex < 0) {
    syncScaleInputs()
    return
  }
  const parsed = scaleInputs.value.map((value) => {
    const normalized = String(value ?? '').trim()
    if (!normalized) return NaN
    return Number(normalized)
  })
  if (parsed.some((value) => !Number.isFinite(value))) {
    uni.showToast({ title: '请输入有效的缩放 X/Y/Z', icon: 'none' })
    syncScaleInputs()
    return
  }
  emit('update-world-text-scale', parsed)
}
</script>

<style scoped>
.scene-debug-input-placeholder {
  color: rgba(148, 163, 184, 0.75);
}
</style>
