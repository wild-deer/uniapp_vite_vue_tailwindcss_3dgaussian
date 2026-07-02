import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

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

      threeScene.add(model)
      console.log('🎲 添加3D模型:', modelConfig.url)
    } catch (error) {
      console.error('❌ 3D模型加载失败:', modelConfig.url, error)
    }
  }
}
