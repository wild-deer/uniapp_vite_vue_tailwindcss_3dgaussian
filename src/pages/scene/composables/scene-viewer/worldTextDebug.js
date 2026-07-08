import { ref } from 'vue'
import * as THREE from 'three'
import {
  exportWorldTextConfig,
  updateWorldTextAngle,
  updateWorldTextPosition,
  updateWorldTextRollAngle,
  updateWorldTextScale,
  updateWorldTextTiltAngle
} from './worldTexts'

export const createWorldTextDebug = ({ threeScene, sceneStore, viewerRef, addTrackedEventListener }) => {
  const worldTextDebugOptions = ref([])
  const selectedWorldTextIndex = ref(-1)
  const selectedWorldTextAngle = ref(0)
  const selectedWorldTextTiltAngle = ref(0)
  const selectedWorldTextRollAngle = ref(0)
  const selectedWorldTextPosition = ref([0, 0, 0])
  const selectedWorldTextScale = ref([1, 1, 1])
  const worldTextDebugState = ref({
    selectedMesh: null,
    dragging: false,
    pointerId: null,
    lastClientX: 0,
    controls: null
  })

  const getWorldTextMeshes = () =>
    threeScene.children.filter((child) => child.userData?.isWorldText)

  const getWorldTextLabel = (worldTextMesh) =>
    worldTextMesh?.userData?.worldTextConfig?.text ||
    `标牌 ${Number(worldTextMesh?.userData?.worldTextIndex) + 1}`

  const getWorldTextPosition = (worldTextMesh) => {
    const [x = 0, y = 0, z = 0] = worldTextMesh?.userData?.worldTextConfig?.position || []
    return [Number(x) || 0, Number(y) || 0, Number(z) || 0]
  }

  const getWorldTextScale = (worldTextMesh) => {
    const [x = 1, y = 1, z = 1] = worldTextMesh?.userData?.worldTextConfig?.scale || []
    return [Number(x) || 0, Number(y) || 0, Number(z) || 0]
  }

  const setWorldTextHighlight = (worldTextMesh, highlighted) => {
    const material = worldTextMesh?.material
    const color = material?.color
    if (!color) {
      return
    }

    color.setStyle(highlighted ? '#67e8f9' : (worldTextMesh.userData?.worldTextBaseColor || '#ffffff'))
    material.needsUpdate = true
  }

  const syncWorldTextDebugOptions = () => {
    const meshes = getWorldTextMeshes()
      .slice()
      .sort(
        (left, right) =>
          (Number(left.userData?.worldTextIndex) || 0) - (Number(right.userData?.worldTextIndex) || 0)
      )

    worldTextDebugOptions.value = meshes.map((mesh, orderIndex) => ({
      index: Number(mesh.userData?.worldTextIndex ?? orderIndex),
      label: getWorldTextLabel(mesh),
      angle: Number(mesh.userData?.worldTextConfig?.angle) || 0,
      tiltAngle: Number(mesh.userData?.worldTextConfig?.tiltAngle) || 0,
      rollAngle: Number(mesh.userData?.worldTextConfig?.rollAngle) || 0
    }))

    const selectedMesh = worldTextDebugState.value.selectedMesh
    if (!selectedMesh) {
      selectedWorldTextIndex.value = -1
      return
    }

    selectedWorldTextIndex.value = Number(selectedMesh.userData?.worldTextIndex ?? -1)
    selectedWorldTextAngle.value = Number(selectedMesh.userData?.worldTextConfig?.angle) || 0
    selectedWorldTextTiltAngle.value = Number(selectedMesh.userData?.worldTextConfig?.tiltAngle) || 0
    selectedWorldTextRollAngle.value = Number(selectedMesh.userData?.worldTextConfig?.rollAngle) || 0
    selectedWorldTextPosition.value = getWorldTextPosition(selectedMesh)
    selectedWorldTextScale.value = getWorldTextScale(selectedMesh)
  }

  const clearWorldTextSelection = () => {
    const selectedMesh = worldTextDebugState.value.selectedMesh
    if (selectedMesh) {
      setWorldTextHighlight(selectedMesh, false)
      viewerRef.value?.forceRenderNextFrame?.()
    }

    worldTextDebugState.value.selectedMesh = null
    selectedWorldTextIndex.value = -1
    selectedWorldTextAngle.value = 0
    selectedWorldTextTiltAngle.value = 0
    selectedWorldTextRollAngle.value = 0
    selectedWorldTextPosition.value = [0, 0, 0]
    selectedWorldTextScale.value = [1, 1, 1]
  }

  const selectWorldText = (worldTextMesh) => {
    if (worldTextDebugState.value.selectedMesh === worldTextMesh) {
      selectedWorldTextIndex.value = Number(worldTextMesh?.userData?.worldTextIndex ?? -1)
      selectedWorldTextAngle.value = Number(worldTextMesh?.userData?.worldTextConfig?.angle) || 0
      selectedWorldTextTiltAngle.value = Number(worldTextMesh?.userData?.worldTextConfig?.tiltAngle) || 0
      selectedWorldTextRollAngle.value = Number(worldTextMesh?.userData?.worldTextConfig?.rollAngle) || 0
      selectedWorldTextPosition.value = getWorldTextPosition(worldTextMesh)
      selectedWorldTextScale.value = getWorldTextScale(worldTextMesh)
      return worldTextMesh
    }

    clearWorldTextSelection()

    if (!worldTextMesh) {
      return null
    }

    setWorldTextHighlight(worldTextMesh, true)
    worldTextDebugState.value.selectedMesh = worldTextMesh
    selectedWorldTextIndex.value = Number(worldTextMesh.userData?.worldTextIndex ?? -1)
    selectedWorldTextAngle.value = Number(worldTextMesh.userData?.worldTextConfig?.angle) || 0
    selectedWorldTextTiltAngle.value = Number(worldTextMesh.userData?.worldTextConfig?.tiltAngle) || 0
    selectedWorldTextRollAngle.value = Number(worldTextMesh.userData?.worldTextConfig?.rollAngle) || 0
    selectedWorldTextPosition.value = getWorldTextPosition(worldTextMesh)
    selectedWorldTextScale.value = getWorldTextScale(worldTextMesh)
    viewerRef.value?.forceRenderNextFrame?.()

    const label = getWorldTextLabel(worldTextMesh)
    sceneStore.setStatus(`已选中标牌「${label}」，左右拖动可调整角度`)
    syncWorldTextDebugOptions()

    return worldTextMesh
  }

  const setWorldTextDragControlsEnabled = (gaussianViewer, enabled) => {
    const controlsList = [
      gaussianViewer?.controls,
      gaussianViewer?.perspectiveControls,
      gaussianViewer?.orthographicControls
    ].filter(Boolean)

    if (enabled) {
      const savedControls = worldTextDebugState.value.controls
      if (savedControls) {
        for (const controls of controlsList) {
          const saved = savedControls.get(controls)
          if (!saved) {
            continue
          }

          Object.entries(saved).forEach(([key, value]) => {
            if (key in controls) {
              controls[key] = value
            }
          })
        }
      }

      worldTextDebugState.value.controls = null
      return
    }

    if (!worldTextDebugState.value.controls) {
      worldTextDebugState.value.controls = new Map()
      for (const controls of controlsList) {
        worldTextDebugState.value.controls.set(controls, {
          enabled: 'enabled' in controls ? controls.enabled : undefined,
          enableRotate: 'enableRotate' in controls ? controls.enableRotate : undefined,
          enableZoom: 'enableZoom' in controls ? controls.enableZoom : undefined,
          enablePan: 'enablePan' in controls ? controls.enablePan : undefined
        })
      }
    }

    for (const controls of controlsList) {
      if ('enabled' in controls) controls.enabled = false
      if ('enableRotate' in controls) controls.enableRotate = false
      if ('enableZoom' in controls) controls.enableZoom = false
      if ('enablePan' in controls) controls.enablePan = false
    }
  }

  const stopWorldTextDragging = (gaussianViewer) => {
    const { dragging, pointerId } = worldTextDebugState.value
    if (!dragging && pointerId === null) {
      return
    }

    const domElement = gaussianViewer?.renderer?.domElement
    if (pointerId !== null && domElement?.releasePointerCapture) {
      try {
        domElement.releasePointerCapture(pointerId)
      } catch (error) {
        console.warn('释放标牌调试指针捕获失败:', error)
      }
    }

    setWorldTextDragControlsEnabled(gaussianViewer, true)
    worldTextDebugState.value.dragging = false
    worldTextDebugState.value.pointerId = null
  }

  const setSelectedWorldTextAngle = (angle = 0, gaussianViewer = viewerRef.value) => {
    const selectedMesh = worldTextDebugState.value.selectedMesh
    if (!selectedMesh || !sceneStore.debugMode) {
      return false
    }

    const safeAngle = Number(angle) || 0
    const updated = updateWorldTextAngle(selectedMesh, safeAngle)
    if (!updated) {
      return false
    }

    selectedWorldTextAngle.value = safeAngle
    syncWorldTextDebugOptions()
    gaussianViewer?.forceRenderNextFrame?.()
    sceneStore.setStatus(`正在调整「${getWorldTextLabel(selectedMesh)}」角度：${safeAngle.toFixed(3)} rad`)
    return true
  }

  const adjustSelectedWorldTextAngle = (gaussianViewer, deltaAngle = 0) => {
    const selectedMesh = worldTextDebugState.value.selectedMesh
    if (!selectedMesh || !sceneStore.debugMode) {
      return false
    }

    const currentAngle = Number(selectedMesh.userData?.worldTextConfig?.angle) || 0
    const nextAngle = currentAngle + deltaAngle
    return setSelectedWorldTextAngle(nextAngle, gaussianViewer)
  }

  const setSelectedWorldTextTiltAngle = (tiltAngle = 0, gaussianViewer = viewerRef.value) => {
    const selectedMesh = worldTextDebugState.value.selectedMesh
    if (!selectedMesh || !sceneStore.debugMode) {
      return false
    }

    const safeTiltAngle = Number(tiltAngle) || 0
    const updated = updateWorldTextTiltAngle(selectedMesh, safeTiltAngle)
    if (!updated) {
      return false
    }

    selectedWorldTextTiltAngle.value = safeTiltAngle
    syncWorldTextDebugOptions()
    gaussianViewer?.forceRenderNextFrame?.()
    sceneStore.setStatus(`正在调整「${getWorldTextLabel(selectedMesh)}」垂直角度：${safeTiltAngle.toFixed(3)} rad`)
    return true
  }

  const setSelectedWorldTextRollAngle = (rollAngle = 0, gaussianViewer = viewerRef.value) => {
    const selectedMesh = worldTextDebugState.value.selectedMesh
    if (!selectedMesh || !sceneStore.debugMode) {
      return false
    }

    const safeRollAngle = Number(rollAngle) || 0
    const updated = updateWorldTextRollAngle(selectedMesh, safeRollAngle)
    if (!updated) {
      return false
    }

    selectedWorldTextRollAngle.value = safeRollAngle
    syncWorldTextDebugOptions()
    gaussianViewer?.forceRenderNextFrame?.()
    sceneStore.setStatus(`正在调整「${getWorldTextLabel(selectedMesh)}」第三轴角度：${safeRollAngle.toFixed(3)} rad`)
    return true
  }

  const setSelectedWorldTextPosition = (position = [0, 0, 0], gaussianViewer = viewerRef.value) => {
    const selectedMesh = worldTextDebugState.value.selectedMesh
    if (!selectedMesh || !sceneStore.debugMode) {
      return false
    }

    const updated = updateWorldTextPosition(selectedMesh, position)
    if (!updated) {
      return false
    }

    selectedWorldTextPosition.value = getWorldTextPosition(selectedMesh)
    syncWorldTextDebugOptions()
    gaussianViewer?.forceRenderNextFrame?.()
    sceneStore.setStatus(
      `正在调整「${getWorldTextLabel(selectedMesh)}」位置：${selectedWorldTextPosition.value
        .map((value) => value.toFixed(3))
        .join(', ')}`
    )
    return true
  }

  const setSelectedWorldTextScale = (scale = [1, 1, 1], gaussianViewer = viewerRef.value) => {
    const selectedMesh = worldTextDebugState.value.selectedMesh
    if (!selectedMesh || !sceneStore.debugMode) {
      return false
    }

    const updated = updateWorldTextScale(selectedMesh, scale)
    if (!updated) {
      return false
    }

    selectedWorldTextScale.value = getWorldTextScale(selectedMesh)
    syncWorldTextDebugOptions()
    gaussianViewer?.forceRenderNextFrame?.()
    sceneStore.setStatus(
      `正在调整「${getWorldTextLabel(selectedMesh)}」缩放：${selectedWorldTextScale.value
        .map((value) => value.toFixed(3))
        .join(', ')}`
    )
    return true
  }

  const selectWorldTextByIndex = (index) => {
    const safeIndex = Number(index)
    if (!Number.isFinite(safeIndex) || safeIndex < 0) {
      clearWorldTextSelection()
      syncWorldTextDebugOptions()
      return false
    }

    const targetMesh = getWorldTextMeshes().find(
      (child) => Number(child.userData?.worldTextIndex) === safeIndex
    )

    if (!targetMesh) {
      return false
    }

    selectWorldText(targetMesh)
    return true
  }

  const setupWorldTextDebugInteractions = (gaussianViewer) => {
    const domElement = gaussianViewer?.renderer?.domElement
    if (!domElement) {
      return
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const resolveWorldTextFromEvent = (event) => {
      const rect = domElement.getBoundingClientRect()
      if (!rect.width || !rect.height || !gaussianViewer?.camera) {
        return null
      }

      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, gaussianViewer.camera)

      const hits = raycaster.intersectObjects(getWorldTextMeshes(), false)
      return hits[0]?.object || null
    }

    const handlePointerDown = (event) => {
      if (!sceneStore.debugMode || event.button !== 0) {
        return
      }

      const worldTextMesh = resolveWorldTextFromEvent(event)
      if (!worldTextMesh) {
        clearWorldTextSelection()
        return
      }

      event.preventDefault()
      event.stopPropagation()

      selectWorldText(worldTextMesh)
      worldTextDebugState.value.dragging = true
      worldTextDebugState.value.pointerId = event.pointerId
      worldTextDebugState.value.lastClientX = event.clientX
      setWorldTextDragControlsEnabled(gaussianViewer, false)
      domElement.setPointerCapture?.(event.pointerId)
    }

    const handlePointerMove = (event) => {
      if (!sceneStore.debugMode || !worldTextDebugState.value.dragging) {
        return
      }

      if (
        worldTextDebugState.value.pointerId !== null &&
        event.pointerId !== worldTextDebugState.value.pointerId
      ) {
        return
      }

      event.preventDefault()
      const deltaX = event.clientX - worldTextDebugState.value.lastClientX
      worldTextDebugState.value.lastClientX = event.clientX

      if (!deltaX) {
        return
      }

      adjustSelectedWorldTextAngle(gaussianViewer, deltaX * 0.01)
    }

    const handlePointerUp = (event) => {
      if (
        worldTextDebugState.value.pointerId !== null &&
        event.pointerId !== worldTextDebugState.value.pointerId
      ) {
        return
      }

      stopWorldTextDragging(gaussianViewer)
    }

    const handleKeyDown = (event) => {
      if (!sceneStore.debugMode || !worldTextDebugState.value.selectedMesh) {
        return
      }

      const rotationStep = event.shiftKey ? 0.1 : 0.02
      if (!['ArrowLeft', 'ArrowRight', 'KeyQ', 'KeyE'].includes(event.code)) {
        return
      }

      event.preventDefault()
      const direction = ['ArrowRight', 'KeyE'].includes(event.code) ? 1 : -1
      adjustSelectedWorldTextAngle(gaussianViewer, direction * rotationStep)
    }

    addTrackedEventListener(domElement, 'pointerdown', handlePointerDown, true)
    addTrackedEventListener(window, 'pointermove', handlePointerMove)
    addTrackedEventListener(window, 'pointerup', handlePointerUp)
    addTrackedEventListener(window, 'pointercancel', handlePointerUp)
    addTrackedEventListener(window, 'keydown', handleKeyDown)
  }

  const setWorldTextDebugEnabled = (enabled) => {
    if (enabled) {
      syncWorldTextDebugOptions()
      if (getWorldTextMeshes().length > 0) {
        if (selectedWorldTextIndex.value < 0) {
          selectWorldTextByIndex(worldTextDebugOptions.value[0]?.index)
        }
        sceneStore.setStatus('标牌调试已开启，可在导航栏选择标牌并使用滑块调整角度')
      }
      return
    }

    stopWorldTextDragging(viewerRef.value)
    clearWorldTextSelection()
    syncWorldTextDebugOptions()
  }

  const copySelectedWorldText = () => {
    const selectedMesh = worldTextDebugState.value.selectedMesh
    if (!selectedMesh) {
      return ''
    }

    return exportWorldTextConfig(selectedMesh)
  }

  return {
    worldTextDebugOptions,
    selectedWorldTextIndex,
    selectedWorldTextAngle,
    selectedWorldTextTiltAngle,
    selectedWorldTextRollAngle,
    selectedWorldTextPosition,
    selectedWorldTextScale,
    syncWorldTextDebugOptions,
    setupWorldTextDebugInteractions,
    setWorldTextDebugEnabled,
    copySelectedWorldText,
    selectWorldTextByIndex,
    setSelectedWorldTextAngle,
    setSelectedWorldTextTiltAngle,
    setSelectedWorldTextRollAngle,
    setSelectedWorldTextPosition,
    setSelectedWorldTextScale
  }
}
