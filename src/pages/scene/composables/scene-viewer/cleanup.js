import * as THREE from 'three'

const disposeMaterial = (material) => {
  if (!material) {
    return
  }

  if (material.map) {
    material.map.dispose()
  }

  material.dispose()
}

const disposeObjectResources = (object3D) => {
  if (!object3D) {
    return
  }

  if (object3D.geometry) {
    object3D.geometry.dispose()
  }

  if (Array.isArray(object3D.material)) {
    object3D.material.forEach(disposeMaterial)
    return
  }

  disposeMaterial(object3D.material)
}

const disposeObjectTree = (object3D) => {
  if (!object3D) {
    return
  }

  if (object3D.children && object3D.children.length > 0) {
    object3D.children.forEach((child) => disposeObjectTree(child))
  }

  disposeObjectResources(object3D)
}

export const logMemoryUsage = () => {
  if (performance.memory) {
    const memory = performance.memory
    console.log('📊 内存使用情况:')
    console.log(`   已使用: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   总分配: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   限制: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`)
  } else {
    console.log('📊 浏览器不支持内存监控')
  }
}

export const checkCleanupStatus = (sceneResources) => {
  const resources = sceneResources.value
  const status = {
    viewer: resources.viewer === null,
    container: resources.container === null,
    eventListeners: resources.eventListeners.length === 0,
    loadedScenes: resources.loadedScenes.length === 0,
    animationFrame: resources.animationFrame === null,
    keyboardAnimationFrame: resources.keyboardAnimationFrame === null,
    blinkAnimationFrame: resources.blinkAnimationFrame === null
  }

  const allClean = Object.values(status).every((clean) => clean)

  console.log('🔍 资源清理状态检查:')
  console.log('   Viewer 已清理:', status.viewer ? '✅' : '❌')
  console.log('   容器已清理:', status.container ? '✅' : '❌')
  console.log('   事件已清理:', status.eventListeners ? '✅' : '❌')
  console.log('   场景已清理:', status.loadedScenes ? '✅' : '❌')
  console.log('   动画帧已清理:', status.animationFrame ? '✅' : '❌')
  console.log('   键盘移动帧已清理:', status.keyboardAnimationFrame ? '✅' : '❌')
  console.log('   闪烁动画帧已清理:', status.blinkAnimationFrame ? '✅' : '❌')
  console.log('   整体状态:', allClean ? '🎉 完全清理' : '⚠️ 存在未清理资源')

  return allClean
}

export const clearThreeScene = (threeScene) => {
  while (threeScene.children.length > 0) {
    const child = threeScene.children[0]
    disposeObjectTree(child)
    threeScene.remove(child)
  }
}

export const performCompleteCleanup = ({
  sceneResources,
  threeScene,
  sceneStore,
  viewerRef,
  logMemoryUsageRef = logMemoryUsage,
  checkCleanupStatusRef = () => checkCleanupStatus(sceneResources)
}) => {
  console.log('开始执行 3D 场景完美清理...')

  try {
    if (sceneResources.value.animationFrame) {
      cancelAnimationFrame(sceneResources.value.animationFrame)
      sceneResources.value.animationFrame = null
      console.log('✓ 动画帧已清除')
    }

    if (sceneResources.value.keyboardAnimationFrame) {
      cancelAnimationFrame(sceneResources.value.keyboardAnimationFrame)
      sceneResources.value.keyboardAnimationFrame = null
      console.log('✓ 键盘移动帧已清除')
    }

    if (sceneResources.value.blinkAnimationFrame) {
      cancelAnimationFrame(sceneResources.value.blinkAnimationFrame)
      sceneResources.value.blinkAnimationFrame = null
      console.log('✓ 闪烁动画帧已清除')
    }

    try {
      if (threeScene && threeScene.children) {
        threeScene.children.forEach((child) => {
          if (child instanceof THREE.Sprite || child instanceof THREE.Mesh) {
            disposeObjectResources(child)
            console.log('✓ 场景文本纹理和材质已清理')
          }
        })
      }
    } catch (error) {
      console.warn('清理Billboard资源时出错:', error)
    }

    if (sceneResources.value.viewer) {
      try {
        sceneResources.value.viewer.stop()
        console.log('✓ 渲染循环已停止')
      } catch (error) {
        console.warn('停止渲染循环时出错:', error)
      }

      if (sceneResources.value.loadedScenes.length > 0) {
        sceneResources.value.loadedScenes.forEach((scene, index) => {
          try {
            if (typeof sceneResources.value.viewer.removeSplatScene === 'function') {
              sceneResources.value.viewer.removeSplatScene(scene)
            }
            console.log(`✓ 高斯泼溅场景 ${index} 已移除`)
          } catch (error) {
            console.warn(`清理高斯泼溅场景 ${index} 时出错:`, error)
          }
        })
        sceneResources.value.loadedScenes = []
      }

      try {
        if (sceneResources.value.viewer.splatMesh) {
          console.log('✓ 清理 SplatMesh 资源')
        }

        if (sceneResources.value.viewer.renderer) {
          const renderer = sceneResources.value.viewer.renderer
          renderer.forceContextLoss()
          renderer.dispose()
          console.log('✓ WebGL 上下文已释放')
        }
      } catch (error) {
        console.warn('清理 WebGL 资源时出错:', error)
      }

      try {
        sceneResources.value.viewer.dispose()
        sceneResources.value.viewer = null
        viewerRef.value = null
        console.log('✓ Gaussian Viewer 已释放')
      } catch (error) {
        console.warn('释放 Viewer 时出错:', error)
        sceneResources.value.viewer = null
        viewerRef.value = null
      }
    }

    clearThreeScene(threeScene)

    if (sceneResources.value.container) {
      while (sceneResources.value.container.firstChild) {
        console.log(sceneResources.value.container.firstChild)
        sceneResources.value.container.removeChild(sceneResources.value.container.firstChild)
      }

      sceneResources.value.container.innerHTML = ''
      sceneResources.value.container = null
      console.log('✓ DOM 容器已清理')
    }

    if (sceneResources.value.eventListeners.length > 0) {
      sceneResources.value.eventListeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options)
      })
      sceneResources.value.eventListeners = []
      console.log('✓ 事件监听器已清理')
    }

    try {
      if (window.THREE && window.THREE.Cache) {
        window.THREE.Cache.clear()
        console.log('✓ Three.js 缓存已清理')
      }

      if (window.GaussianSplats3D && window.GaussianSplats3D.Cache) {
        window.GaussianSplats3D.Cache.clear()
        console.log('✓ 高斯泼溅缓存已清理')
      }
    } catch (error) {
      console.warn('清理缓存时出错:', error)
    }

    if (window.gc && typeof window.gc === 'function') {
      window.gc()
      console.log('✓ 强制垃圾回收完成')
    }

    setTimeout(() => {
      if (window.gc && typeof window.gc === 'function') {
        window.gc()
        console.log('✓ 延迟垃圾回收完成')
      }
    }, 100)

    sceneStore.setLoading(false)
    sceneStore.setStatus('场景已清理')

    setTimeout(() => {
      logMemoryUsageRef()
      checkCleanupStatusRef()
    }, 200)

    console.log('🎉 3D 场景完美清理完成!')
  } catch (error) {
    console.error('清理过程中出现错误:', error)
  }
}
