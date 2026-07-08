import * as THREE from 'three'

export const GAUSSIAN_BACKGROUND_COLOR = '#000000'

export const applyGaussianBackground = (threeScene, container) => {
  if (threeScene) {
    threeScene.background = new THREE.Color(GAUSSIAN_BACKGROUND_COLOR)
  }

  if (container) {
    container.style.backgroundColor = GAUSSIAN_BACKGROUND_COLOR
  }
}

export const normalizeRotationToQuaternion = (rotation) => {
  const identity = [0, 0, 0, 1]
  if (!rotation || !Array.isArray(rotation)) return identity
  if (rotation.length === 4) return rotation
  if (rotation.length === 3) {
    const euler = new THREE.Euler(rotation[0], rotation[1], rotation[2], 'XYZ')
    const quat = new THREE.Quaternion()
    quat.setFromEuler(euler)
    return [quat.x, quat.y, quat.z, quat.w]
  }
  return identity
}

export const loadGaussianSplats = async (gaussianViewer, sceneStore, sceneResources) => {
  const splats = sceneStore.sceneConfig.gaussianSplats

  if (splats.length === 0) {
    console.log('ℹ️ 未配置高斯泼溅点云')
    return
  }

  for (const splatConfig of splats) {
    if (!splatConfig.url || splatConfig.url.trim() === '') {
      console.warn('⚠️ 高斯泼溅URL为空，跳过加载')
      continue
    }

    sceneStore.setStatus(`正在加载高斯泼溅: ${splatConfig.url}`)

    try {
      const scene = await gaussianViewer.addSplatScene(splatConfig.url, {
        splatAlphaRemovalThreshold: 1,
        showLoadingUI: true,
        gpuAcceleratedSort: true,
         sphericalHarmonicsDegree: 0, 
        progressiveLoad: false,
        position: splatConfig.position,
        rotation: normalizeRotationToQuaternion(splatConfig.rotation),
        scale: splatConfig.scale
      })

      if (scene) {
        sceneResources.value.loadedScenes.push(scene)
      }

      console.log('🌟 添加高斯泼溅:', splatConfig.url)
    } catch (error) {
      console.error('❌ 高斯泼溅加载失败:', splatConfig.url, error)
    }
  }
}
