import { ref } from 'vue'
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d'
import * as THREE from 'three'
import {
  applyBillboardCameraView,
  loadBillboards,
  setupBillboardInteractions
} from './scene-viewer/billboards'
import { loadWorldTexts } from './scene-viewer/worldTexts'
import { load3DModels } from './scene-viewer/models'
import { applyGaussianBackground, loadGaussianSplats } from './scene-viewer/gaussianSplats'
import {
  checkCleanupStatus as checkCleanupStatusBase,
  clearThreeScene,
  logMemoryUsage,
  performCompleteCleanup as performCompleteCleanupBase
} from './scene-viewer/cleanup'

export function useSceneViewer(sceneStore) {
  const viewer = ref(null)
  const threeScene = new THREE.Scene()
  const keyboardMovementSpeed = 2.4

  const sceneResources = ref({
    viewer: null,
    container: null,
    animationFrame: null,
    keyboardAnimationFrame: null,
    stopKeyboardMovement: null,
    eventListeners: [],
    loadedScenes: []
  })

  const checkCleanupStatus = () => checkCleanupStatusBase(sceneResources)

  const performCompleteCleanup = () =>
    performCompleteCleanupBase({
      sceneResources,
      threeScene,
      sceneStore,
      viewerRef: viewer,
      logMemoryUsageRef: logMemoryUsage,
      checkCleanupStatusRef: checkCleanupStatus
    })

  const enableDevTools = () => {
    if (!sceneStore.isDevelopment) return
    if (typeof window === 'undefined') return

    window.debugMemory = logMemoryUsage
    window.checkCleanup = checkCleanupStatus
    window.forceCleanup = performCompleteCleanup

    console.log('🔧 开发调试功能已启用:')
    console.log('   window.debugMemory() - 查看内存使用')
    console.log('   window.checkCleanup() - 检查清理状态')
    console.log('   window.forceCleanup() - 强制清理资源')
  }

  const setupViewerFocusOnDoubleClick = (gaussianViewer) => {
    const domElement = gaussianViewer?.renderer?.domElement
    const pointerUpListener = gaussianViewer?.mouseUpListener
    if (!domElement) {
      return
    }

    if (pointerUpListener) {
      domElement.removeEventListener('pointerup', pointerUpListener, false)
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const getInteractiveBillboards = () =>
      threeScene.children.filter(
        (child) => child.userData?.isBillboard && child.userData?.cameraView
      )

    const handleDoubleClickFocus = (event) => {
      if (sceneStore.interactionLocked && !sceneStore.debugMode) {
        return
      }

      const rect = domElement.getBoundingClientRect()
      if (rect.width && rect.height && gaussianViewer?.camera) {
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, gaussianViewer.camera)

        const billboardHits = raycaster.intersectObjects(getInteractiveBillboards(), false)
        if (billboardHits.length > 0) {
          return
        }
      }

      gaussianViewer?.onMouseClick?.(event)
    }

    addTrackedEventListener(domElement, 'dblclick', handleDoubleClickFocus)
  }

  const getCameraLookAt = (gaussianViewer) => {
    const camera = gaussianViewer?.camera
    const controls = gaussianViewer?.controls
    if (!camera) {
      return null
    }

    if (controls?.target?.clone) {
      return controls.target.clone()
    }

    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    return camera.position.clone().add(direction)
  }

  const disableBuiltInKeyboardPan = (gaussianViewer) => {
    const safelyStopKeyEvents = (controls) => {
      if (!controls?._domElementKeyEvents || typeof controls.stopListenToKeyEvents !== 'function') {
        return
      }

      controls.stopListenToKeyEvents()
    }

    safelyStopKeyEvents(gaussianViewer?.controls)
    safelyStopKeyEvents(gaussianViewer?.perspectiveControls)
    safelyStopKeyEvents(gaussianViewer?.orthographicControls)
  }

  const setupKeyboardHorizontalMovement = (gaussianViewer) => {
    if (typeof window === 'undefined' || !gaussianViewer?.camera) {
      return
    }

    const isMovementLocked = () => sceneStore.interactionLocked && !sceneStore.debugMode
    const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD'])
    const activeKeys = new Set()
    const moveDirection = new THREE.Vector3()
    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()
    const worldUp = new THREE.Vector3()
    const fallbackForward = new THREE.Vector3(0, 0, -1)
    let lastFrameTime = 0

    const moveCameraHorizontally = (deltaSeconds) => {
      if (isMovementLocked()) {
        return false
      }

      const camera = gaussianViewer.camera
      const controls = gaussianViewer.controls
      const lookAt = getCameraLookAt(gaussianViewer)
      if (!camera || !lookAt || activeKeys.size === 0) {
        return false
      }

      worldUp.copy(camera.up).normalize()

      forward.copy(lookAt).sub(camera.position).projectOnPlane(worldUp)
      if (forward.lengthSq() === 0) {
        forward.copy(fallbackForward).projectOnPlane(worldUp)
      }
      if (forward.lengthSq() === 0) {
        return false
      }
      forward.normalize()

      right.setFromMatrixColumn(camera.matrixWorld, 0).projectOnPlane(worldUp)
      if (right.lengthSq() === 0) {
        right.crossVectors(forward, worldUp)
      }
      if (right.lengthSq() === 0) {
        return false
      }
      right.normalize()

      moveDirection.set(0, 0, 0)

      if (activeKeys.has('KeyW')) moveDirection.add(forward)
      if (activeKeys.has('KeyS')) moveDirection.sub(forward)
      if (activeKeys.has('KeyA')) moveDirection.sub(right)
      if (activeKeys.has('KeyD')) moveDirection.add(right)

      if (moveDirection.lengthSq() === 0) {
        return false
      }
      const moveDistance = keyboardMovementSpeed * deltaSeconds

      moveDirection.normalize().multiplyScalar(moveDistance)
      camera.position.add(moveDirection)

      if (controls?.target) {
        controls.target.add(moveDirection)
        controls.update?.()
      } else {
        lookAt.add(moveDirection)
        camera.lookAt(lookAt)
      }

      camera.updateMatrixWorld?.(true)
      gaussianViewer.forceRenderNextFrame?.()
      return true
    }

    const stopMovementLoop = () => {
      if (sceneResources.value.keyboardAnimationFrame) {
        cancelAnimationFrame(sceneResources.value.keyboardAnimationFrame)
        sceneResources.value.keyboardAnimationFrame = null
      }
      lastFrameTime = 0
    }

    sceneResources.value.stopKeyboardMovement = stopMovementLoop

    const startMovementLoop = () => {
      if (sceneResources.value.keyboardAnimationFrame) {
        return
      }

      const tick = (currentTime) => {
        if (isMovementLocked()) {
          activeKeys.clear()
          stopMovementLoop()
          return
        }

        if (activeKeys.size === 0) {
          stopMovementLoop()
          return
        }

        const elapsed = lastFrameTime ? currentTime - lastFrameTime : 16.67
        lastFrameTime = currentTime
        const deltaSeconds = Math.min(elapsed, 32) / 1000

        moveCameraHorizontally(deltaSeconds)
        sceneResources.value.keyboardAnimationFrame = requestAnimationFrame(tick)
      }

      sceneResources.value.keyboardAnimationFrame = requestAnimationFrame(tick)
    }

    const handleKeyDown = (event) => {
      if (isMovementLocked()) {
        return
      }

      if (!movementKeys.has(event.code)) {
        return
      }

      event.preventDefault()
      activeKeys.add(event.code)
      startMovementLoop()
    }

    const handleKeyUp = (event) => {
      if (!movementKeys.has(event.code)) {
        return
      }

      activeKeys.delete(event.code)
      if (activeKeys.size === 0) {
        stopMovementLoop()
      }
    }

    const handleWindowBlur = () => {
      activeKeys.clear()
      stopMovementLoop()
    }

    addTrackedEventListener(window, 'keydown', handleKeyDown)
    addTrackedEventListener(window, 'keyup', handleKeyUp)
    addTrackedEventListener(window, 'blur', handleWindowBlur)
  }

  const viewerInteractionSnapshot = ref({
    pointerEvents: null,
    controls: null
  })

  const setViewerInteractionLocked = (locked) => {
    const gaussianViewer = viewer.value
    const domElement = gaussianViewer?.renderer?.domElement
    const controlsList = [
      gaussianViewer?.controls,
      gaussianViewer?.perspectiveControls,
      gaussianViewer?.orthographicControls
    ].filter(Boolean)

    if (!locked) {
      if (domElement && viewerInteractionSnapshot.value.pointerEvents !== null) {
        domElement.style.pointerEvents = viewerInteractionSnapshot.value.pointerEvents || ''
      }

      const savedControls = viewerInteractionSnapshot.value.controls
      if (savedControls) {
        for (const controls of controlsList) {
          const saved = savedControls.get(controls)
          if (saved) {
            Object.entries(saved).forEach(([key, value]) => {
              if (key in controls) controls[key] = value
            })
          }
        }
      }

      viewerInteractionSnapshot.value.controls = null
      viewerInteractionSnapshot.value.pointerEvents = null
      return
    }

    if (domElement) {
      if (viewerInteractionSnapshot.value.pointerEvents === null) {
        viewerInteractionSnapshot.value.pointerEvents = domElement.style.pointerEvents ?? ''
      }
      domElement.style.pointerEvents = 'none'
    }

    if (!viewerInteractionSnapshot.value.controls) {
      viewerInteractionSnapshot.value.controls = new Map()
      for (const controls of controlsList) {
        viewerInteractionSnapshot.value.controls.set(controls, {
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

    sceneResources.value.stopKeyboardMovement?.()
  }

  const moveCameraToView = (cameraView) =>
    new Promise((resolve) => {
      const gaussianViewer = viewer.value
      if (!gaussianViewer) {
        resolve(false)
        return
      }

      let resolved = false
      const done = (value) => {
        if (resolved) return
        resolved = true
        resolve(!!value)
      }

      const ok = applyBillboardCameraView(gaussianViewer, cameraView, sceneResources, {
        onComplete: () => done(true)
      })

      if (!ok) {
        done(false)
      }
    })

  const initViewer = () => {
    const container = document.getElementById('gaussian-viewer')
    if (!container) {
      sceneStore.setStatus('容器初始化失败')
      return
    }

    enableDevTools()
    applyGaussianBackground(threeScene, container)

    sceneResources.value.container = container

    sceneStore.setLoading(true)
    sceneStore.setStatus('正在初始化3D场景...')

    const cameraConfig = sceneStore.sceneConfig.camera
    const gaussianViewer = new GaussianSplats3D.Viewer({
      rootElement: container,
      cameraUp: cameraConfig.up,
      initialCameraPosition: cameraConfig.position,
      initialCameraLookAt: cameraConfig.lookAt,
      sharedMemoryForWorkers: true,
      threeScene
    })

    sceneResources.value.viewer = gaussianViewer
    viewer.value = gaussianViewer

    initSceneComponents(gaussianViewer)
  }

  const initSceneComponents = async (gaussianViewer) => {
    try {
      clearThreeScene(threeScene)

      await loadBillboards(threeScene, sceneStore.sceneConfig.billboards)
      await loadWorldTexts(threeScene, sceneStore.sceneConfig.worldTexts)
      await load3DModels(threeScene, sceneStore)
      await loadGaussianSplats(gaussianViewer, sceneStore, sceneResources)

      gaussianViewer.start()
      disableBuiltInKeyboardPan(gaussianViewer)
      setupKeyboardHorizontalMovement(gaussianViewer)
      setupViewerFocusOnDoubleClick(gaussianViewer)
      setupBillboardInteractions({
        gaussianViewer,
        threeScene,
        addTrackedEventListener,
        sceneStore,
        sceneResources
      })

      sceneStore.setLoading(false)
      sceneStore.setStatus('场景加载完成')
      console.log('🎉 3D场景初始化成功!')
    } catch (error) {
      sceneStore.setLoading(false)
      sceneStore.setStatus(`场景加载失败: ${error.message}`)
      console.error('场景加载错误:', error)
      performCompleteCleanup()
    }
  }

  const addTrackedEventListener = (element, event, handler) => {
    element.addEventListener(event, handler)
    sceneResources.value.eventListeners.push({ element, event, handler })
  }

  const resetCameraView = () => {
    const gaussianViewer = viewer.value
    if (!gaussianViewer) return false
    return applyBillboardCameraView(gaussianViewer, sceneStore.sceneConfig.camera, sceneResources)
  }

  return {
    viewer,
    initViewer,
    performCompleteCleanup,
    logMemoryUsage,
    checkCleanupStatus,
    addTrackedEventListener,
    resetCameraView,
    moveCameraToView,
    setViewerInteractionLocked
  }
}
