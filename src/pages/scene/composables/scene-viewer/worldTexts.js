import * as THREE from 'three'

const createTextCanvas = ({
  text = '',
  fontSize,
  fontsize,
  fontFamily = 'Arial',
  textColor = '#ffffff',
  strokeColor = '#000000',
  strokeWidth = 4,
  backgroundColor = 'rgba(0, 0, 0, 0)',
  padding = 48
} = {}) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const width = 1024
  const height = 256

  canvas.width = width
  canvas.height = height

  context.clearRect(0, 0, width, height)

  if (backgroundColor !== 'transparent') {
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, width, height)
  }

  const resolvedFontSize = Number(fontSize ?? fontsize ?? 48)

  context.font = `${resolvedFontSize}px ${fontFamily}`
  context.fillStyle = textColor
  context.strokeStyle = strokeColor
  context.lineWidth = strokeWidth
  context.lineJoin = 'round'
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const centerX = width / 2
  const centerY = height / 2
  const maxTextWidth = width - padding * 2

  context.strokeText(text, centerX, centerY, maxTextWidth)
  context.fillText(text, centerX, centerY, maxTextWidth)

  return canvas
}

export const createWorldText = (config = {}) => {
  const {
    text = '',
    position = [0, 5, 0],
    rotation = [0, 0, 0],
    scale = [8, 2, 1],
    doubleSided = true,
    opacity = 1,
    alphaTest = 0.05,
    blended = false,
    depthTest = true,
    depthWrite = true,
    renderOrder = 0
  } = config

  const texture = new THREE.CanvasTexture(createTextCanvas(config))
  texture.flipY = false
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  const useBlendedTransparency = blended || opacity < 1

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: useBlendedTransparency,
    opacity,
    alphaTest: useBlendedTransparency ? 0 : alphaTest,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    depthTest,
    depthWrite: useBlendedTransparency ? false : depthWrite,
    toneMapped: false
  })

  const geometry = new THREE.PlaneGeometry(1, 1)
  const textMesh = new THREE.Mesh(geometry, material)
  textMesh.position.set(...position)
  textMesh.rotation.set(...rotation)
  textMesh.scale.set(...scale)
  textMesh.renderOrder = renderOrder

  return textMesh
}

export const loadWorldTexts = async (threeScene, worldTexts = []) => {
  if (!Array.isArray(worldTexts) || worldTexts.length === 0) {
    return
  }

  for (const worldTextConfig of worldTexts) {
    const worldText = createWorldText(worldTextConfig)
    threeScene.add(worldText)
    console.log('🪧 添加固定朝向文本:', worldTextConfig.text || '默认文字')
  }
}
