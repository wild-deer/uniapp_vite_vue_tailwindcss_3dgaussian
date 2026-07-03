import * as THREE from 'three'

const isValidVector3 = (value) =>
  Array.isArray(value) && value.length === 3 && value.every((item) => Number.isFinite(item))

const normalizeCameraView = (cameraView) => {
  if (!cameraView || !isValidVector3(cameraView.position) || !isValidVector3(cameraView.lookAt)) {
    return null
  }

  return {
    position: [...cameraView.position],
    lookAt: [...cameraView.lookAt],
    up: isValidVector3(cameraView.up) ? [...cameraView.up] : null,
    duration: Number.isFinite(cameraView.duration) ? Math.max(cameraView.duration, 0) : 1000
  }
}

const easeInOutCubic = (progress) => {
  if (progress < 0.5) {
    return 4 * progress * progress * progress
  }

  return 1 - Math.pow(-2 * progress + 2, 3) / 2
}

const getCurrentLookAt = (camera, controls, fallbackTarget) => {
  if (controls?.target) {
    return controls.target.clone()
  }

  const direction = new THREE.Vector3()
  camera.getWorldDirection(direction)
  const distance =
    fallbackTarget?.distanceTo?.(camera.position) ||
    camera.position.length() ||
    1

  return camera.position.clone().add(direction.multiplyScalar(distance))
}

const createCanvasTexture = (drawCanvas) => {
  const texture = new THREE.CanvasTexture(drawCanvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

const createBackgroundCanvas = ({
  width = 512,
  height = 128,
  backgroundColor = 'rgba(0, 0, 0, 0)'
} = {}) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height

  context.clearRect(0, 0, width, height)

  if (backgroundColor !== 'transparent') {
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, width, height)
  }

  return canvas
}

const createTextCanvas = ({
  text = '',
  fontSize,
  fontsize,
  fontFamily = 'Arial',
  textColor = '#ffffff',
  strokeColor = '#000000',
  strokeWidth = 4,
  canvasWidth = 512,
  canvasHeight = 128,
  padding = 32
} = {}) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  context.clearRect(0, 0, canvas.width, canvas.height)

  const resolvedFontSize = Number(fontSize ?? fontsize ?? 48)

  context.font = `${resolvedFontSize}px ${fontFamily}`
  context.fillStyle = textColor
  context.strokeStyle = strokeColor
  context.lineWidth = strokeWidth
  context.lineJoin = 'round'
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const maxTextWidth = Math.max(canvas.width - padding * 2, 0)

  context.strokeText(text, centerX, centerY, maxTextWidth)
  context.fillText(text, centerX, centerY, maxTextWidth)

  return canvas
}

export const createBillboard = (config = {}) => {
  const {
    text = '',
    position = [0, 5, 0],
    scale = [8, 2, 1],
    boardWidth = null,
    boardHeight = null,
    fontSize,
    fontsize,
    fontFamily = 'Arial',
    textColor = '#ffffff',
    strokeColor = '#000000',
    strokeWidth = 4,
    backgroundColor = 'rgba(0, 0, 0, 0)',
    canvasWidth = 512,
    canvasHeight = 128,
    padding = 32,
    cameraView = null
  } = config

  const backgroundTexture = createCanvasTexture(
    createBackgroundCanvas({
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor
    })
  )
  const textTexture = createCanvasTexture(
    createTextCanvas({
      text,
      fontSize,
      fontsize,
      fontFamily,
      textColor,
      strokeColor,
      strokeWidth,
      canvasWidth,
      canvasHeight,
      padding
    })
  )

  const material = new THREE.SpriteMaterial({
    map: backgroundTexture,
    transparent: true,
    alphaTest: 0.1
  })

  const billboard = new THREE.Sprite(material)
  billboard.position.set(...position)

  const resolvedBoardWidth = Number.isFinite(boardWidth) ? boardWidth : scale[0]
  const resolvedBoardHeight = Number.isFinite(boardHeight) ? boardHeight : scale[1]
  billboard.scale.set(resolvedBoardWidth, resolvedBoardHeight, scale[2] ?? 1)

  const textMaterial = new THREE.SpriteMaterial({
    map: textTexture,
    transparent: true,
    alphaTest: 0.05
  })
  const textSprite = new THREE.Sprite(textMaterial)
  textSprite.scale.set(scale[0], scale[1], scale[2] ?? 1)
  textSprite.position.set(0, 0, 0.001)
  billboard.add(textSprite)

  billboard.userData = {
    ...billboard.userData,
    isBillboard: true,
    billboardText: text,
    cameraView: normalizeCameraView(cameraView)
  }

  return billboard
}

export const loadBillboards = async (threeScene, billboards = []) => {
  if (billboards.length === 0) {
    threeScene.add(createBillboard())
    return
  }

  for (const billboardConfig of billboards) {
    const billboard = createBillboard(billboardConfig)
    threeScene.add(billboard)
    console.log('📋 添加广告牌:', billboardConfig.text || '默认文字')
  }
}

export const applyBillboardCameraView = (gaussianViewer, cameraView, sceneResources, options = null) => {
  const normalizedCameraView = normalizeCameraView(cameraView)
  if (!gaussianViewer?.camera || !normalizedCameraView) {
    return false
  }

  const { camera, controls } = gaussianViewer
  const targetPosition = new THREE.Vector3(...normalizedCameraView.position)
  const targetLookAt = new THREE.Vector3(...normalizedCameraView.lookAt)
  const targetUp = normalizedCameraView.up
    ? new THREE.Vector3(...normalizedCameraView.up)
    : camera.up.clone()

  const startPosition = camera.position.clone()
  const startLookAt = getCurrentLookAt(camera, controls, targetLookAt)
  const startUp = camera.up.clone()
  const duration = normalizedCameraView.duration

  if (sceneResources?.value?.animationFrame) {
    cancelAnimationFrame(sceneResources.value.animationFrame)
    sceneResources.value.animationFrame = null
  }

  if (duration === 0) {
    camera.position.copy(targetPosition)
    camera.up.copy(targetUp).normalize()
    camera.lookAt(targetLookAt)
    camera.updateProjectionMatrix?.()
    camera.updateMatrixWorld?.(true)

    if (controls?.target) {
      controls.target.copy(targetLookAt)
      controls.update?.()
    }

    if (typeof options?.onComplete === 'function') {
      options.onComplete()
    }
    return true
  }

  const startTime = performance.now()
  const currentLookAt = new THREE.Vector3()

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1)
    const easedProgress = easeInOutCubic(progress)

    camera.position.lerpVectors(startPosition, targetPosition, easedProgress)
    camera.up.lerpVectors(startUp, targetUp, easedProgress).normalize()
    currentLookAt.lerpVectors(startLookAt, targetLookAt, easedProgress)
    camera.lookAt(currentLookAt)
    camera.updateProjectionMatrix?.()
    camera.updateMatrixWorld?.(true)

    if (controls?.target) {
      controls.target.copy(currentLookAt)
      controls.update?.()
    }

    if (progress < 1) {
      sceneResources.value.animationFrame = requestAnimationFrame(animate)
      return
    }

    sceneResources.value.animationFrame = null
    if (typeof options?.onComplete === 'function') {
      options.onComplete()
    }
  }

  sceneResources.value.animationFrame = requestAnimationFrame(animate)

  return true
}

export const setupBillboardInteractions = ({
  gaussianViewer,
  threeScene,
  addTrackedEventListener,
  sceneStore,
  sceneResources
}) => {
  const domElement = gaussianViewer?.renderer?.domElement
  if (!domElement || typeof addTrackedEventListener !== 'function') {
    return
  }

  const getInteractiveBillboards = () =>
    threeScene.children.filter(
      (child) => child.userData?.isBillboard && child.userData?.cameraView
    )

  if (getInteractiveBillboards().length === 0) {
    return
  }

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const dragThreshold = 6
  let pointerDownPosition = null

  const getIntersectedBillboard = (event) => {
    if (!gaussianViewer?.camera) {
      return null
    }

    const rect = domElement.getBoundingClientRect()
    if (!rect.width || !rect.height) {
      return null
    }

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, gaussianViewer.camera)

    const intersections = raycaster.intersectObjects(getInteractiveBillboards(), false)
    return intersections[0]?.object || null
  }

  const handlePointerDown = (event) => {
    pointerDownPosition = {
      x: event.clientX,
      y: event.clientY
    }
  }

  const handlePointerUp = (event) => {
    if (!pointerDownPosition) {
      return
    }

    const movement = Math.hypot(
      event.clientX - pointerDownPosition.x,
      event.clientY - pointerDownPosition.y
    )
    pointerDownPosition = null

    if (movement > dragThreshold) {
      return
    }

    const billboard = getIntersectedBillboard(event)
    const cameraView = billboard?.userData?.cameraView
    if (!cameraView) {
      return
    }

    const hasApplied = applyBillboardCameraView(gaussianViewer, cameraView, sceneResources)
    if (!hasApplied) {
      return
    }

    const billboardText = billboard.userData.billboardText || '广告牌'
    sceneStore?.setStatus?.(`已跳转到 ${billboardText} 视角`)
    console.log('🎯 已跳转 Billboard 镜头:', billboardText, cameraView)
  }

  const handlePointerMove = (event) => {
    const billboard = getIntersectedBillboard(event)
    domElement.style.cursor = billboard ? 'pointer' : 'default'
  }

  const resetCursor = () => {
    pointerDownPosition = null
    domElement.style.cursor = 'default'
  }

  addTrackedEventListener(domElement, 'pointerdown', handlePointerDown)
  addTrackedEventListener(domElement, 'pointerup', handlePointerUp)
  addTrackedEventListener(domElement, 'pointermove', handlePointerMove)
  addTrackedEventListener(domElement, 'pointerleave', resetCursor)
  addTrackedEventListener(domElement, 'pointercancel', resetCursor)
}
