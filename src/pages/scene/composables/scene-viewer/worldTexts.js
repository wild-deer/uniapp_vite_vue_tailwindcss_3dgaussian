import * as THREE from 'three'

const DEFAULT_CANVAS_HEIGHT = 256
const DEFAULT_CANVAS_ASPECT = 4
const DEFAULT_UP = new THREE.Vector3(0, 1, 0)
const DEFAULT_RIGHT = new THREE.Vector3(1, 0, 0)

const formatNumber = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return String(value)
  }

  return value.toFixed(5).replace(/\.?0+$/, '')
}

const formatVector = (values = []) => values.map((value) => formatNumber(value))

const resolvePosition = (position = [0, 5, 0]) => {
  const [x = 0, y = 5, z = 0] = Array.isArray(position) ? position : []
  return [Number(x) || 0, Number(y) || 0, Number(z) || 0]
}

const resolveScale = (scale = [8, 2, 1]) => {
  const [x = 8, y = 2, z = 1] = Array.isArray(scale) ? scale : []
  return [Number(x) || 0, Number(y) || 0, Number(z) || 0]
}

const serializeConfigObject = (config = {}) => {
  const normalizeExportValue = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => normalizeExportValue(item))
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, entryValue]) => [key, normalizeExportValue(entryValue)])
      )
    }

    if (typeof value === 'number') {
      return Number(formatNumber(value))
    }

    return value
  }

  return JSON.stringify(normalizeExportValue(config), null, 2)
}

const resolveUpDirection = (up = [0, 1, 0]) => {
  const [x = 0, y = 1, z = 0] = Array.isArray(up) ? up : []
  const upDirection = new THREE.Vector3(Number(x) || 0, Number(y) || 0, Number(z) || 0)

  if (upDirection.lengthSq() === 0) {
    return DEFAULT_UP.clone()
  }

  return upDirection.normalize()
}

const applyPanelOrientation = (
  mesh,
  up = [0, 1, 0],
  angle = 0,
  tiltAngle = 0,
  rollAngle = 0
) => {
  const upDirection = resolveUpDirection(up)
  const alignQuaternion = new THREE.Quaternion().setFromUnitVectors(DEFAULT_UP, upDirection)
  const spinQuaternion = new THREE.Quaternion().setFromAxisAngle(
    upDirection,
    Number(angle) || 0
  )
  const baseQuaternion = spinQuaternion.clone().multiply(alignQuaternion)
  const rightAxis = DEFAULT_RIGHT.clone().applyQuaternion(baseQuaternion).normalize()
  const tiltQuaternion = new THREE.Quaternion().setFromAxisAngle(
    rightAxis,
    Number(tiltAngle) || 0
  )
  const tiltBaseQuaternion = tiltQuaternion.clone().multiply(baseQuaternion)
  const forwardAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(tiltBaseQuaternion).normalize()
  const rollQuaternion = new THREE.Quaternion().setFromAxisAngle(
    forwardAxis,
    Number(rollAngle) || 0
  )

  mesh.quaternion.copy(tiltBaseQuaternion)
  mesh.quaternion.premultiply(rollQuaternion)
}

const buildWorldTextDebugData = ({
  config = {},
  index = -1,
  angle = 0,
  tiltAngle = 0,
  rollAngle = 0,
  up = [0, 1, 0],
  position = [0, 5, 0],
  scale = [8, 2, 1]
} = {}) => {
  const snapshot = {
    ...config,
    angle,
    tiltAngle,
    rollAngle,
    up: [...up],
    position: [...position],
    scale: [...scale]
  }

  return {
    isWorldText: true,
    worldTextIndex: index,
    worldTextConfig: snapshot,
    worldTextBaseColor: '#ffffff',
    exportConfig() {
      return serializeConfigObject(this.worldTextConfig || snapshot)
    }
  }
}

const resolveCanvasSize = ({
  text = '',
  fontSize = 48,
  fontFamily = 'Arial',
  strokeWidth = 4,
  padding = 48,
  scale = [8, 2, 1]
} = {}) => {
  const measureCanvas = document.createElement('canvas')
  const measureContext = measureCanvas.getContext('2d')

  if (!measureContext) {
    return {
      width: DEFAULT_CANVAS_HEIGHT * DEFAULT_CANVAS_ASPECT,
      height: DEFAULT_CANVAS_HEIGHT
    }
  }

  measureContext.font = `${fontSize}px ${fontFamily}`

  const metrics = measureContext.measureText(text || '')
  const textWidth = Math.max(metrics.width, fontSize)
  const textHeight = Math.max(
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    fontSize
  )

  const minWidth = Math.ceil(textWidth + padding * 2 + strokeWidth * 2)
  const minHeight = Math.ceil(textHeight + padding * 2 + strokeWidth * 2)

  const scaleWidth = Math.abs(Number(scale?.[0])) || 0
  const scaleHeight = Math.abs(Number(scale?.[1])) || 0
  const targetAspect =
    scaleWidth > 0 && scaleHeight > 0
      ? scaleWidth / scaleHeight
      : Math.max(minWidth / Math.max(minHeight, 1), DEFAULT_CANVAS_ASPECT)

  const widthFromHeight = Math.ceil(minHeight * targetAspect)
  const heightFromWidth = Math.ceil(minWidth / targetAspect)
  const width = Math.max(minWidth, widthFromHeight)
  const height = Math.max(minHeight, heightFromWidth)

  return {
    width,
    height
  }
}

const createTextCanvas = ({
  text = '',
  fontSize,
  fontsize,
  fontFamily = 'Arial',
  textColor = '#ffffff',
  strokeColor = '#000000',
  strokeWidth = 4,
  backgroundColor = 'rgba(0, 0, 0, 0)',
  padding = 48,
  scale = [8, 2, 1]
} = {}) => {
  const resolvedFontSize = Number(fontSize ?? fontsize ?? 48)
  const { width, height } = resolveCanvasSize({
    text,
    fontSize: resolvedFontSize,
    fontFamily,
    strokeWidth,
    padding,
    scale
  })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    return canvas
  }

  canvas.width = width
  canvas.height = height

  context.clearRect(0, 0, width, height)

  if (backgroundColor !== 'transparent') {
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, width, height)
  }

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

export const createWorldText = (config = {}, index = -1) => {
  const {
    text = '',
    position = [0, 5, 0],
    up = [0, 1, 0],
    angle = 0,
    tiltAngle = 0,
    rollAngle = 0,
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
  const safePosition = resolvePosition(position)
  const safeScale = resolveScale(scale)
  textMesh.position.set(...safePosition)
  applyPanelOrientation(textMesh, up, angle, tiltAngle, rollAngle)
  textMesh.scale.set(...safeScale)
  textMesh.renderOrder = renderOrder
  textMesh.userData = {
    ...textMesh.userData,
    ...buildWorldTextDebugData({
      config,
      index,
      angle: Number(angle) || 0,
      tiltAngle: Number(tiltAngle) || 0,
      rollAngle: Number(rollAngle) || 0,
      up: resolveUpDirection(up).toArray(),
      position: safePosition,
      scale: safeScale
    })
  }
  textMesh.userData.worldTextBaseColor = material.color.getStyle()

  return textMesh
}

export const updateWorldTextAngle = (worldTextMesh, angle = 0) => {
  if (!worldTextMesh?.userData?.isWorldText) {
    return false
  }

  const safeAngle = Number(angle) || 0
  const up = worldTextMesh.userData.worldTextConfig?.up || [0, 1, 0]
  const tiltAngle = Number(worldTextMesh.userData.worldTextConfig?.tiltAngle) || 0
  const rollAngle = Number(worldTextMesh.userData.worldTextConfig?.rollAngle) || 0
  applyPanelOrientation(worldTextMesh, up, safeAngle, tiltAngle, rollAngle)
  worldTextMesh.userData.worldTextConfig = {
    ...(worldTextMesh.userData.worldTextConfig || {}),
    angle: safeAngle
  }

  return true
}

export const updateWorldTextTiltAngle = (worldTextMesh, tiltAngle = 0) => {
  if (!worldTextMesh?.userData?.isWorldText) {
    return false
  }

  const safeTiltAngle = Number(tiltAngle) || 0
  const up = worldTextMesh.userData.worldTextConfig?.up || [0, 1, 0]
  const angle = Number(worldTextMesh.userData.worldTextConfig?.angle) || 0
  const rollAngle = Number(worldTextMesh.userData.worldTextConfig?.rollAngle) || 0
  applyPanelOrientation(worldTextMesh, up, angle, safeTiltAngle, rollAngle)
  worldTextMesh.userData.worldTextConfig = {
    ...(worldTextMesh.userData.worldTextConfig || {}),
    tiltAngle: safeTiltAngle
  }

  return true
}

export const updateWorldTextRollAngle = (worldTextMesh, rollAngle = 0) => {
  if (!worldTextMesh?.userData?.isWorldText) {
    return false
  }

  const safeRollAngle = Number(rollAngle) || 0
  const up = worldTextMesh.userData.worldTextConfig?.up || [0, 1, 0]
  const angle = Number(worldTextMesh.userData.worldTextConfig?.angle) || 0
  const tiltAngle = Number(worldTextMesh.userData.worldTextConfig?.tiltAngle) || 0
  applyPanelOrientation(worldTextMesh, up, angle, tiltAngle, safeRollAngle)
  worldTextMesh.userData.worldTextConfig = {
    ...(worldTextMesh.userData.worldTextConfig || {}),
    rollAngle: safeRollAngle
  }

  return true
}

export const updateWorldTextPosition = (worldTextMesh, position = [0, 0, 0]) => {
  if (!worldTextMesh?.userData?.isWorldText) {
    return false
  }

  const safePosition = resolvePosition(position)
  worldTextMesh.position.set(...safePosition)
  worldTextMesh.userData.worldTextConfig = {
    ...(worldTextMesh.userData.worldTextConfig || {}),
    position: safePosition
  }

  return true
}

export const updateWorldTextScale = (worldTextMesh, scale = [1, 1, 1]) => {
  if (!worldTextMesh?.userData?.isWorldText) {
    return false
  }

  const safeScale = resolveScale(scale)
  worldTextMesh.scale.set(...safeScale)
  worldTextMesh.userData.worldTextConfig = {
    ...(worldTextMesh.userData.worldTextConfig || {}),
    scale: safeScale
  }

  return true
}

export const exportWorldTextConfig = (worldTextMesh) => {
  if (!worldTextMesh?.userData?.isWorldText || typeof worldTextMesh.userData.exportConfig !== 'function') {
    return ''
  }

  return worldTextMesh.userData.exportConfig()
}

export const loadWorldTexts = async (threeScene, worldTexts = []) => {
  if (!Array.isArray(worldTexts) || worldTexts.length === 0) {
    return
  }

  for (const [index, worldTextConfig] of worldTexts.entries()) {
    const worldText = createWorldText(worldTextConfig, index)
    threeScene.add(worldText)
    console.log('🪧 添加固定朝向文本:', worldTextConfig.text || '默认文字')
  }
}
