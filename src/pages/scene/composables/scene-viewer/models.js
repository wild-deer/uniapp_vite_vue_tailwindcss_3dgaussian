import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import * as THREE from 'three'

export const getModelLoader = (url) => {
  const extension = url.split('.').pop().toLowerCase()

  switch (extension) {
    case 'gltf':
    case 'glb':
      return new GLTFLoader()
    case 'obj':
      return new OBJLoader()
    case 'fbx':
      return new FBXLoader()
    default:
      return new GLTFLoader()
  }
}

export const loadModelAsync = (loader, url) => {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (model) => resolve(model.scene || model),
      (progress) => {
        console.log('模型加载进度:', progress)
      },
      (error) => reject(error)
    )
  })
}

const toUnlitMaterial = (material) => {
  if (!material) return material

  const base = material.isMeshBasicMaterial ? material.clone() : material

  const unlit = material.isMeshBasicMaterial
    ? base
    : new THREE.MeshBasicMaterial({
        name: base.name,
        color: base.color?.clone?.() ?? new THREE.Color(0xffffff),
        map: base.map ?? null,
        alphaMap: base.alphaMap ?? null,
        transparent: base.transparent ?? false,
        opacity: base.opacity ?? 1,
        alphaTest: base.alphaTest ?? 0,
        side: base.side ?? THREE.FrontSide,
        depthTest: base.depthTest ?? true,
        depthWrite: base.depthWrite ?? true,
        wireframe: base.wireframe ?? false,
        vertexColors: base.vertexColors ?? false,
        blending: base.blending,
        premultipliedAlpha: base.premultipliedAlpha ?? false,
        fog: base.fog ?? true
      })

  unlit.skinning = base.skinning ?? false
  unlit.morphTargets = base.morphTargets ?? false
  unlit.morphNormals = base.morphNormals ?? false
  unlit.toneMapped = false
  unlit.needsUpdate = true

  return unlit
}

export const applyUnlitMaterials = (model) => {
  model.traverse((obj) => {
    if (!obj?.isMesh) return

    obj.castShadow = false
    obj.receiveShadow = false

    if (Array.isArray(obj.material)) {
      obj.material = obj.material.map((m) => toUnlitMaterial(m))
      return
    }

    obj.material = toUnlitMaterial(obj.material)
  })
}

export const load3DModels = async (threeScene, sceneStore) => {
  const models = sceneStore.sceneConfig.models3D

  for (const modelConfig of models) {
    sceneStore.setStatus(`正在加载3D模型: ${modelConfig.url}`)

    try {
      const loader = getModelLoader(modelConfig.url)
      const model = await loadModelAsync(loader, modelConfig.url)

      model.position.set(...modelConfig.position)
      model.rotation.set(...modelConfig.rotation.slice(0, 3))
      model.scale.set(...modelConfig.scale)

      const useUnlit = modelConfig.unlit !== false && modelConfig.materialMode !== 'lit'
      if (useUnlit) {
        applyUnlitMaterials(model)
      }

      threeScene.add(model)
      console.log('🎲 添加3D模型:', modelConfig.url)
    } catch (error) {
      console.error('❌ 3D模型加载失败:', modelConfig.url, error)
    }
  }
}
