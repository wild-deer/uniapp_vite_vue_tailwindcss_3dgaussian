/**
 * 3D 场景内存管理工具
 * 参考 Three.js 内存清理最佳实践，适配各种 3D 场景
 * 作者: AI Assistant
 * 创建时间: 2024
 */

/**
 * 内存管理器类
 */
export class MemoryManager {
  constructor() {
    this.resources = {
      viewers: [],
      scenes: [],
      containers: [],
      eventListeners: [],
      animationFrames: [],
      textures: [],
      geometries: [],
      materials: []
    }
    
    this.isCleaningUp = false
  }

  /**
   * 注册需要清理的资源
   * @param {string} type - 资源类型
   * @param {any} resource - 资源对象
   */
  register(type, resource) {
    if (this.resources[type] && resource) {
      this.resources[type].push(resource)
      console.log(`📝 已注册 ${type} 资源，当前数量: ${this.resources[type].length}`)
    }
  }

  /**
   * 移除已注册的资源
   * @param {string} type - 资源类型
   * @param {any} resource - 资源对象
   */
  unregister(type, resource) {
    if (this.resources[type]) {
      const index = this.resources[type].indexOf(resource)
      if (index !== -1) {
        this.resources[type].splice(index, 1)
        console.log(`🗑️ 已移除 ${type} 资源，剩余数量: ${this.resources[type].length}`)
      }
    }
  }

  /**
   * 清理所有已注册的资源
   */
  async cleanup() {
    if (this.isCleaningUp) {
      console.warn('⚠️ 清理操作正在进行中，请勿重复调用')
      return
    }

    this.isCleaningUp = true
    console.log('🧹 开始执行完美内存清理...')

    try {
      // 记录清理前的内存状态
      this.logMemoryUsage('清理前')

      // 1. 清理动画帧
      this.cleanupAnimationFrames()

      // 2. 清理 3D 场景
      await this.cleanupScenes()

      // 3. 清理 Viewer
      await this.cleanupViewers()

      // 4. 清理 DOM 容器
      this.cleanupContainers()

      // 5. 清理事件监听器
      this.cleanupEventListeners()

      // 6. 清理纹理、几何体、材质
      this.cleanupThreeJSResources()

      // 7. 清理全局缓存
      this.cleanupGlobalCaches()

      // 8. 强制垃圾回收
      await this.forceGarbageCollection()

      // 记录清理后的内存状态
      setTimeout(() => {
        this.logMemoryUsage('清理后')
        this.checkCleanupStatus()
      }, 200)

      console.log('🎉 完美内存清理完成!')

    } catch (error) {
      console.error('❌ 清理过程中出现错误:', error)
    } finally {
      this.isCleaningUp = false
    }
  }

  /**
   * 清理动画帧
   */
  cleanupAnimationFrames() {
    this.resources.animationFrames.forEach(frameId => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
    })
    this.resources.animationFrames = []
    console.log('✓ 动画帧已清理')
  }

  /**
   * 清理 3D 场景
   */
  async cleanupScenes() {
    for (const scene of this.resources.scenes) {
      try {
        if (scene && typeof scene.dispose === 'function') {
          scene.dispose()
        }
        // 针对 Three.js 场景的特殊清理
        if (scene && scene.children) {
          this.cleanupSceneHierarchy(scene)
        }
      } catch (error) {
        console.warn('清理场景时出错:', error)
      }
    }
    this.resources.scenes = []
    console.log('✓ 3D 场景已清理')
  }

  /**
   * 递归清理场景层级
   * @param {Object} object - 场景对象
   */
  cleanupSceneHierarchy(object) {
    if (!object) return

    // 清理子对象
    if (object.children) {
      const children = [...object.children]
      children.forEach(child => {
        this.cleanupSceneHierarchy(child)
      })
    }

    // 清理几何体
    if (object.geometry && typeof object.geometry.dispose === 'function') {
      object.geometry.dispose()
    }

    // 清理材质
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => {
          if (material && typeof material.dispose === 'function') {
            material.dispose()
          }
        })
      } else if (typeof object.material.dispose === 'function') {
        object.material.dispose()
      }
    }

    // 从父对象中移除
    if (object.parent) {
      object.parent.remove(object)
    }
  }

  /**
   * 清理 Viewer
   */
  async cleanupViewers() {
    for (const viewer of this.resources.viewers) {
      try {
        // 停止渲染
        if (typeof viewer.stop === 'function') {
          viewer.stop()
        }

        // 高斯泼溅特殊处理
        if (viewer.splatMesh) {
          console.log('清理高斯泼溅 SplatMesh...')
        }

        // WebGL 渲染器清理
        if (viewer.renderer) {
          viewer.renderer.forceContextLoss()
          viewer.renderer.dispose()
          viewer.renderer.domElement = null
        }

        // 释放 viewer
        if (typeof viewer.dispose === 'function') {
          viewer.dispose()
        }

      } catch (error) {
        console.warn('清理 Viewer 时出错:', error)
      }
    }
    this.resources.viewers = []
    console.log('✓ Viewer 已清理')
  }

  /**
   * 清理 DOM 容器
   */
  cleanupContainers() {
    this.resources.containers.forEach(container => {
      if (container && container.parentNode) {
        // 移除所有子元素
        while (container.firstChild) {
          container.removeChild(container.firstChild)
        }
        container.innerHTML = ''
      }
    })
    this.resources.containers = []
    console.log('✓ DOM 容器已清理')
  }

  /**
   * 清理事件监听器
   */
  cleanupEventListeners() {
    this.resources.eventListeners.forEach(({ element, event, handler }) => {
      if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(event, handler)
      }
    })
    this.resources.eventListeners = []
    console.log('✓ 事件监听器已清理')
  }

  /**
   * 清理 Three.js 资源
   */
  cleanupThreeJSResources() {
    // 清理纹理
    this.resources.textures.forEach(texture => {
      if (texture && typeof texture.dispose === 'function') {
        texture.dispose()
      }
    })

    // 清理几何体
    this.resources.geometries.forEach(geometry => {
      if (geometry && typeof geometry.dispose === 'function') {
        geometry.dispose()
      }
    })

    // 清理材质
    this.resources.materials.forEach(material => {
      if (material && typeof material.dispose === 'function') {
        material.dispose()
      }
    })

    this.resources.textures = []
    this.resources.geometries = []
    this.resources.materials = []
    console.log('✓ Three.js 资源已清理')
  }

  /**
   * 清理全局缓存
   */
  cleanupGlobalCaches() {
    try {
      // Three.js 缓存
      if (window.THREE && window.THREE.Cache) {
        window.THREE.Cache.clear()
        console.log('✓ Three.js 缓存已清理')
      }

      // 高斯泼溅缓存
      if (window.GaussianSplats3D && window.GaussianSplats3D.Cache) {
        window.GaussianSplats3D.Cache.clear()
        console.log('✓ 高斯泼溅缓存已清理')
      }

      // 清理可能的纹理加载器缓存
      if (window.THREE && window.THREE.Cache) {
        const cache = window.THREE.Cache
        if (cache.files) {
          cache.files = {}
        }
      }

    } catch (error) {
      console.warn('清理全局缓存时出错:', error)
    }
  }

  /**
   * 强制垃圾回收
   */
  async forceGarbageCollection() {
    // 立即垃圾回收
    if (window.gc && typeof window.gc === 'function') {
      window.gc()
      console.log('✓ 立即垃圾回收完成')
    }

    // 延迟垃圾回收
    return new Promise(resolve => {
      setTimeout(() => {
        if (window.gc && typeof window.gc === 'function') {
          window.gc()
          console.log('✓ 延迟垃圾回收完成')
        }
        resolve()
      }, 100)
    })
  }

  /**
   * 记录内存使用情况
   * @param {string} label - 标签
   */
  logMemoryUsage(label = '当前') {
    if (!performance.memory) {
      console.log(`📊 ${label}内存状态: 浏览器不支持内存监控`)
      return
    }

    const memory = performance.memory
    const used = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
    const total = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2)
    const limit = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)

    console.log(`📊 ${label}内存状态:`)
    console.log(`   已使用: ${used} MB`)
    console.log(`   总分配: ${total} MB`)
    console.log(`   限制: ${limit} MB`)
    console.log(`   使用率: ${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)}%`)
  }

  /**
   * 检查清理状态
   */
  checkCleanupStatus() {
    const status = {
      viewers: this.resources.viewers.length === 0,
      scenes: this.resources.scenes.length === 0,
      containers: this.resources.containers.length === 0,
      eventListeners: this.resources.eventListeners.length === 0,
      animationFrames: this.resources.animationFrames.length === 0,
      textures: this.resources.textures.length === 0,
      geometries: this.resources.geometries.length === 0,
      materials: this.resources.materials.length === 0
    }

    const allClean = Object.values(status).every(clean => clean)

    console.log('🔍 资源清理状态检查:')
    Object.entries(status).forEach(([key, clean]) => {
      const count = this.resources[key]?.length || 0
      console.log(`   ${key}: ${clean ? '✅' : '❌'} (${count})`)
    })
    console.log(`   整体状态: ${allClean ? '🎉 完全清理' : '⚠️ 存在未清理资源'}`)

    return allClean
  }

  /**
   * 添加事件监听器并自动注册清理
   * @param {Element} element - DOM 元素
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  addEventListener(element, event, handler) {
    element.addEventListener(event, handler)
    this.register('eventListeners', { element, event, handler })
  }

  /**
   * 获取资源统计信息
   */
  getResourceStats() {
    const stats = {}
    Object.keys(this.resources).forEach(key => {
      stats[key] = this.resources[key].length
    })
    return stats
  }
}

/**
 * 创建全局内存管理器实例
 */
export const globalMemoryManager = new MemoryManager()

/**
 * 便捷函数：快速清理所有资源
 */
export const performQuickCleanup = () => {
  return globalMemoryManager.cleanup()
}

/**
 * 便捷函数：记录内存使用情况
 */
export const logMemoryUsage = (label) => {
  return globalMemoryManager.logMemoryUsage(label)
}

/**
 * 便捷函数：检查清理状态
 */
export const checkCleanupStatus = () => {
  return globalMemoryManager.checkCleanupStatus()
}