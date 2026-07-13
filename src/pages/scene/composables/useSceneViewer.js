import { ref, watch } from 'vue'
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d'
import * as THREE from 'three'
import {
  applyBillboardCameraView,
  createBillboard,
  loadBillboards,
  setupBillboardInteractions,
  updateBillboardBlink
} from './scene-viewer/billboards'
import { loadWorldTexts } from './scene-viewer/worldTexts'
import { load3DModels } from './scene-viewer/models'
import { applyGaussianBackground, loadGaussianSplats } from './scene-viewer/gaussianSplats'
import { addIrregularCubeToScene, loadIrregularCubes } from './scene-viewer/irregularCubes'
import {
  checkCleanupStatus as checkCleanupStatusBase,
  clearThreeScene,
  logMemoryUsage,
  performCompleteCleanup as performCompleteCleanupBase
} from './scene-viewer/cleanup'
import { disableBuiltInKeyboardPan, setupKeyboardHorizontalMovement } from './scene-viewer/keyboardMove'
import { createWorldTextDebug } from './scene-viewer/worldTextDebug'
import { createViewerLocker } from './scene-viewer/viewerLock'
import { setupViewerFocusOnDoubleClick } from './scene-viewer/focusOnDblclick'
import { enableDevTools } from './scene-viewer/devtools'

export function useSceneViewer(sceneStore) {
  const viewer = ref(null)
  const threeScene = new THREE.Scene()

  const sceneResources = ref({
    viewer: null,
    container: null,
    animationFrame: null,
    keyboardAnimationFrame: null,
    blinkAnimationFrame: null,
    stopKeyboardMovement: null,
    eventListeners: [],
    loadedScenes: []
  })

  // 视频 billboard 点击回调，由 scene.vue 注入 selectVideo
  const videoBillboardClickCallback = ref(null)

  // --- Lifecycle / Cleanup ---

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

  const addTrackedEventListener = (element, event, handler, options = undefined) => {
    element.addEventListener(event, handler, options)
    sceneResources.value.eventListeners.push({ element, event, handler, options })
  }

  const createIrregularCube = (points, options = {}) => {
    const object = addIrregularCubeToScene(threeScene, points, options)
    viewer.value?.forceRenderNextFrame?.()
    return object
  }

  // --- Sub-module instances ---

  const worldTextDebug = createWorldTextDebug({
    threeScene,
    sceneStore,
    viewerRef: viewer,
    addTrackedEventListener
  })

  const { setViewerInteractionLocked } = createViewerLocker({
    viewerRef: viewer,
    sceneResources
  })

  // --- Init helpers ---

  let axesHelperRef = null

  const addAxesHelper = () => {
    if (axesHelperRef) return axesHelperRef
    const axesHelper = new THREE.AxesHelper(2000)
    axesHelper.userData.isAxesHelper = true
    axesHelper.renderOrder = 9999
    axesHelper.traverse((child) => {
      const material = child?.material
      if (!material) return
      if (Array.isArray(material)) {
        material.forEach((item) => {
          if (!item) return
          item.depthTest = false
          item.depthWrite = false
        })
        return
      }
      material.depthTest = false
      material.depthWrite = false
    })
    threeScene.add(axesHelper)
    axesHelperRef = axesHelper
    return axesHelper
  }

  const removeAxesHelper = () => {
    if (!axesHelperRef) return
    threeScene.remove(axesHelperRef)
    axesHelperRef = null
  }

  const toggleAxesHelper = () => {
    if (axesHelperRef) {
      removeAxesHelper()
    } else {
      addAxesHelper()
    }
    viewer.value?.forceRenderNextFrame?.()
  }

  const toggleIrregularCubes = async () => {
    const existing = threeScene.children.filter((child) => child.userData?.isIrregularCube)
    if (existing.length > 0) {
      existing.forEach((child) => threeScene.remove(child))
    } else {
      await loadIrregularCubes(threeScene, sceneStore)
    }
    viewer.value?.forceRenderNextFrame?.()
  }

  // 监听 store 状态变化，立即生效
  let sceneInitialized = false
  watch(
    () => sceneStore.showAxesHelper,
    (visible) => {
      if (!sceneInitialized) return
      if (visible && !axesHelperRef) {
        addAxesHelper()
        viewer.value?.forceRenderNextFrame?.()
      } else if (!visible && axesHelperRef) {
        removeAxesHelper()
        viewer.value?.forceRenderNextFrame?.()
      }
    }
  )

  watch(
    () => sceneStore.showIrregularCubes,
    async (visible) => {
      if (!sceneInitialized) return
      const existing = threeScene.children.filter((child) => child.userData?.isIrregularCube)
      if (visible && existing.length === 0) {
        await loadIrregularCubes(threeScene, sceneStore)
        viewer.value?.forceRenderNextFrame?.()
      } else if (!visible && existing.length > 0) {
        existing.forEach((child) => threeScene.remove(child))
        viewer.value?.forceRenderNextFrame?.()
      }
    }
  )

  const initSceneComponents = async (gaussianViewer) => {
    try {
      clearThreeScene(threeScene)
      axesHelperRef = null
      if (sceneStore.showAxesHelper) {
        addAxesHelper()
      }

      await loadBillboards(threeScene, sceneStore.sceneConfig.billboards)

      // 从 videos 中创建 billboard：视频标记了 "billboard": true 的条目，在场景中生成可点击的广告牌
      const videos = Array.isArray(sceneStore.sceneConfig.videos) ? sceneStore.sceneConfig.videos : []
      for (const video of videos) {
        if (!video?.billboard) continue
        const cameraPos = video?.camera?.position || video?.position
        if (!cameraPos || !Array.isArray(cameraPos) || cameraPos.length < 3) continue
        // billboard 为对象时可自定义参数（pngUrl, svgUrl, scale, fontSize 等），position 可覆盖 camera 位置
        const billboardOverrides = typeof video.billboard === 'object' && video.billboard !== null ? video.billboard : {}
        try {
          const videoBillboard = await createBillboard({
            text: video.title || video.name || '镜头',
            position: billboardOverrides.position || cameraPos,
            scale: [4, 1.5, 1],
            fontSize: 64,
            textColor: '#ffffff',
            strokeColor: '#00a2ff',
            backgroundColor: 'rgba(0, 52, 105, 0)',
            // 透传 billboard 对象中的自定义参数
            ...billboardOverrides,
            // 但 cameraView 始终从 video 配置提取，防止被覆盖
            cameraView: {
              position: video?.camera?.position || video?.position,
              lookAt: video?.camera?.lookAt || video?.lookAt,
              ...(video?.camera?.up || video?.up ? { up: video?.camera?.up || video?.up } : {}),
              ...(Number.isFinite(video?.camera?.duration) ? { duration: video.camera.duration } : Number.isFinite(video?.duration) ? { duration: video.duration } : {})
            }
          })
          videoBillboard.userData.isVideoBillboard = true
          videoBillboard.userData.videoData = video
          threeScene.add(videoBillboard)
          console.log('📋 添加视频关联广告牌:', video.title || video.name || '未命名')
        } catch (err) {
          console.warn('⚠️ 创建视频关联广告牌失败:', err)
        }
      }

      await loadWorldTexts(threeScene, sceneStore.sceneConfig.worldTexts)
      worldTextDebug.syncWorldTextDebugOptions()
      await load3DModels(threeScene, sceneStore)
      if (sceneStore.showIrregularCubes) {
        await loadIrregularCubes(threeScene, sceneStore)
      }
      await loadGaussianSplats(gaussianViewer, sceneStore, sceneResources)

      gaussianViewer.start()
      disableBuiltInKeyboardPan(gaussianViewer)
      setupKeyboardHorizontalMovement({
        gaussianViewer,
        sceneStore,
        sceneResources,
        addTrackedEventListener
      })
      setupViewerFocusOnDoubleClick({
        gaussianViewer,
        threeScene,
        sceneStore,
        addTrackedEventListener
      })
      worldTextDebug.setupWorldTextDebugInteractions(gaussianViewer)
      setupBillboardInteractions({
        gaussianViewer,
        threeScene,
        addTrackedEventListener,
        sceneStore,
        sceneResources,
        onVideoBillboardClick: (video, billboard) => {
          if (typeof videoBillboardClickCallback.value === 'function') {
            videoBillboardClickCallback.value(video, billboard)
          }
        }
      })

      // Start billboard blink animation loop
      const blinkLoop = () => {
        updateBillboardBlink(threeScene)
        sceneResources.value.blinkAnimationFrame = requestAnimationFrame(blinkLoop)
      }
      sceneResources.value.blinkAnimationFrame = requestAnimationFrame(blinkLoop)

      sceneStore.setLoading(false)
      sceneStore.setStatus('场景加载完成')
      sceneInitialized = true
      console.log('🎉 3D场景初始化成功!')
    } catch (error) {
      sceneStore.setLoading(false)
      sceneStore.setStatus(`场景加载失败: ${error.message}`)
      console.error('场景加载错误:', error)
      performCompleteCleanup()
    }
  }

  const initViewer = () => {
    const container = document.getElementById('gaussian-viewer')
    if (!container) {
      sceneStore.setStatus('容器初始化失败')
      return
    }

    enableDevTools({
      sceneStore,
      logMemoryUsage,
      checkCleanupStatus,
      performCompleteCleanup,
      createIrregularCube
    })
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
      sharedMemoryForWorkers: false,
      threeScene
    })

    sceneResources.value.viewer = gaussianViewer
    viewer.value = gaussianViewer

    initSceneComponents(gaussianViewer)
  }

  // --- Camera operations ---

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

  const resetCameraView = () =>
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

      const ok = applyBillboardCameraView(gaussianViewer, sceneStore.sceneConfig.camera, sceneResources, {
        onComplete: () => done(true)
      })

      if (!ok) {
        done(false)
      }
    })

  // --- Public API (identical to before) ---

  return {
    viewer,
    initViewer,
    performCompleteCleanup,
    logMemoryUsage,
    checkCleanupStatus,
    addTrackedEventListener,
    resetCameraView,
    createIrregularCube,
    moveCameraToView,
    setViewerInteractionLocked,
    setWorldTextDebugEnabled: worldTextDebug.setWorldTextDebugEnabled,
    toggleAxesHelper,
    toggleIrregularCubes,
    copySelectedWorldText: worldTextDebug.copySelectedWorldText,
    worldTextDebugOptions: worldTextDebug.worldTextDebugOptions,
    selectedWorldTextIndex: worldTextDebug.selectedWorldTextIndex,
    selectedWorldTextAngle: worldTextDebug.selectedWorldTextAngle,
    selectedWorldTextTiltAngle: worldTextDebug.selectedWorldTextTiltAngle,
    selectedWorldTextRollAngle: worldTextDebug.selectedWorldTextRollAngle,
    selectedWorldTextPosition: worldTextDebug.selectedWorldTextPosition,
    selectedWorldTextScale: worldTextDebug.selectedWorldTextScale,
    selectWorldTextByIndex: worldTextDebug.selectWorldTextByIndex,
    setSelectedWorldTextAngle: worldTextDebug.setSelectedWorldTextAngle,
    setSelectedWorldTextTiltAngle: worldTextDebug.setSelectedWorldTextTiltAngle,
    setSelectedWorldTextRollAngle: worldTextDebug.setSelectedWorldTextRollAngle,
    setSelectedWorldTextPosition: worldTextDebug.setSelectedWorldTextPosition,
    setSelectedWorldTextScale: worldTextDebug.setSelectedWorldTextScale,
    setVideoBillboardClickCallback: (fn) => {
      videoBillboardClickCallback.value = typeof fn === 'function' ? fn : null
    }
  }
}
