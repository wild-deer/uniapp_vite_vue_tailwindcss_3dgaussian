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

  const sceneResources = ref({
    viewer: null,
    container: null,
    animationFrame: null,
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
    resetCameraView
  }
}
