import * as THREE from 'three'

const isValidVector3 = (value) =>
  Array.isArray(value) && value.length === 3 && value.every((item) => Number.isFinite(item))

// --- Image / SVG support utilities ---

const renderImageToCanvas = (imageUrl, width, height) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = imageUrl
  })
}

const renderSVGToCanvas = (svgString, width, height) => {
  return new Promise((resolve, reject) => {
    // Override SVG width/height to rasterize at target resolution, preventing aliasing
    const sizedSVG = svgString
      .replace(/\bwidth\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\bheight\s*=\s*["'][^"']*["']/gi, '')
      .replace(/<svg/i, `<svg width="${width}" height="${height}"`)

    const blob = new Blob([sizedSVG], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to render SVG'))
    }

    img.src = url
  })
}

const fetchSVGText = async (url) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG: ${response.status}`)
  }
  return response.text()
}

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

const createLayerSprite = async (layerConfig = {}, canvasWidth = 2048, canvasHeight = 2048, scaleArr = [8, 2, 1]) => {
  const {
    pngUrl,
    blink = false,
    blinkInterval = 500,
    blinkColor = [0.2, 0.2, 0.2]
  } = layerConfig

  if (!pngUrl) {
    throw new Error('Layer requires pngUrl')
  }

  const imageCanvas = await renderImageToCanvas(pngUrl, canvasWidth, canvasHeight)
  const texture = createCanvasTexture(imageCanvas)

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1
  })

  const sprite = new THREE.Sprite(material)
  sprite.scale.set(...scaleArr)

  sprite.userData = {
    isLayer: true,
    blink,
    blinkInterval,
    blinkColor
  }

  return sprite
}

export const createBillboard = async (config = {}) => {
  const {
    text = '',
    pngUrl = null,
    svg = null,
    svgUrl = null,
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
    canvasWidth = 2048,
    canvasHeight = 2048,
    padding = 32,
    cameraView = null,
    layers = null
  } = config

  // --- Multi-layer mode: stack multiple PNG layers ---
  if (layers && Array.isArray(layers) && layers.length > 0) {
    const resolvedBoardWidth = Number.isFinite(boardWidth) ? boardWidth : scale[0]
    const resolvedBoardHeight = Number.isFinite(boardHeight) ? boardHeight : scale[1]
    const resolvedScaleZ = scale[2] ?? 1

    const baseMaterial = new THREE.SpriteMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
    const billboard = new THREE.Sprite(baseMaterial)
    billboard.position.set(...position)
    billboard.scale.set(resolvedBoardWidth, resolvedBoardHeight, resolvedScaleZ)

    for (let i = 0; i < layers.length; i++) {
      const layerConfig = layers[i]
      try {
        const layerSprite = await createLayerSprite(
          layerConfig,
          canvasWidth,
          canvasHeight,
          [resolvedBoardWidth, resolvedBoardHeight, resolvedScaleZ]
        )
        layerSprite.position.set(0, 0, (i + 1) * 0.001)
        billboard.add(layerSprite)
        console.log(`📋 已加载图层 ${i + 1}:`, layerConfig.pngUrl)
      } catch (err) {
        console.warn(`⚠️ 无法加载图层 ${i + 1}:`, layerConfig.pngUrl, err)
      }
    }

    billboard.userData = {
      ...billboard.userData,
      isBillboard: true,
      isMultiLayer: true,
      billboardText: text || '(多层广告牌)',
      cameraView: normalizeCameraView(cameraView)
    }

    return billboard
  }

  // --- Original single-layer logic ---
  let mainTexture = null

  // Try PNG first (raster image from URL)
  if (pngUrl) {
    try {
      const imageCanvas = await renderImageToCanvas(pngUrl, canvasWidth, canvasHeight)
      mainTexture = createCanvasTexture(imageCanvas)
      console.log('📋 已加载 PNG:', pngUrl)
    } catch (err) {
      console.warn('⚠️ 无法加载PNG，回退到文字模式:', pngUrl, err)
    }
  }

  // Try SVG (either inline svg string or svgUrl)
  if (!mainTexture && (svg || svgUrl)) {
    let svgString = svg

    if (svgUrl && !svg) {
      try {
        svgString = await fetchSVGText(svgUrl)
        console.log('📋 已加载 SVG:', svgUrl)
      } catch (err) {
        console.warn('⚠️ 无法从URL加载SVG，回退到文字模式:', svgUrl, err)
      }
    }

    if (svgString) {
      try {
        const svgCanvas = await renderSVGToCanvas(svgString, canvasWidth, canvasHeight)
        mainTexture = createCanvasTexture(svgCanvas)
      } catch (err) {
        console.warn('⚠️ 无法渲染SVG，回退到文字模式:', err)
      }
    }
  }

  // Fallback: background canvas for text mode, or if SVG failed
  const backgroundTexture = mainTexture || createCanvasTexture(
    createBackgroundCanvas({
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor
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

  // Only add text overlay when NOT using SVG
  if (!mainTexture) {
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
    const textMaterial = new THREE.SpriteMaterial({
      map: textTexture,
      transparent: true,
      alphaTest: 0.05
    })
    const textSprite = new THREE.Sprite(textMaterial)
    textSprite.scale.set(scale[0], scale[1], scale[2] ?? 1)
    textSprite.position.set(0, 0, 0.001)
    billboard.add(textSprite)
  }

  billboard.userData = {
    ...billboard.userData,
    isBillboard: true,
    billboardText: text || '(SVG)',
    cameraView: normalizeCameraView(cameraView)
  }

  return billboard
}

export const loadBillboards = async (threeScene, billboards = []) => {
  if (billboards.length === 0) {
    const billboard = await createBillboard()
    threeScene.add(billboard)
    return
  }

  for (const billboardConfig of billboards) {
    const billboard = await createBillboard(billboardConfig)
    threeScene.add(billboard)
    console.log('📋 添加广告牌:', billboardConfig.text || billboardConfig.pngUrl || billboardConfig.svgUrl || '默认文字')
  }
}

export const updateBillboardBlink = (threeScene) => {
  if (!threeScene) return

  const now = performance.now()
  const billboards = threeScene.children.filter((c) => c.userData?.isBillboard)

  for (const billboard of billboards) {
    for (const child of billboard.children) {
      if (!child.userData?.isLayer || !child.userData?.blink) continue

      const { blinkInterval, blinkColor } = child.userData
      const phaseInCycle = now % blinkInterval
      // Sine-based smooth blink: t oscillates between 0 (blinkColor) and 1 (white)
      const t = Math.sin((phaseInCycle / blinkInterval) * Math.PI * 2) * 0.5 + 0.5

      const [br, bg, bb] = blinkColor
      child.material.color.setRGB(
        THREE.MathUtils.lerp(br, 1, t),
        THREE.MathUtils.lerp(bg, 1, t),
        THREE.MathUtils.lerp(bb, 1, t)
      )
    }
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
  sceneResources,
  onVideoBillboardClick
}) => {
  const domElement = gaussianViewer?.renderer?.domElement
  if (!domElement || typeof addTrackedEventListener !== 'function') {
    return
  }

  const getInteractiveBillboards = () => {
    const result = []
    for (const child of threeScene.children) {
      if (child.userData?.isBillboard && child.userData?.cameraView) {
        result.push(child)
        // For multi-layer billboards, also include layer children for hit testing
        if (child.userData?.isMultiLayer) {
          for (const layerChild of child.children) {
            if (layerChild.userData?.isLayer) {
              result.push(layerChild)
            }
          }
        }
      }
    }
    return result
  }

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
    const hit = intersections[0]?.object || null
    if (!hit) return null

    // If we hit a layer child, traverse up to its billboard parent
    if (hit.userData?.isLayer && hit.parent?.userData?.isBillboard) {
      return hit.parent
    }

    return hit
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
    if (!billboard) {
      return
    }

    // 视频关联的 billboard：触发视频播放流程（镜头移动 + 播放视频）
    if (billboard.userData?.isVideoBillboard && typeof onVideoBillboardClick === 'function') {
      const videoData = billboard.userData.videoData
      if (videoData) {
        onVideoBillboardClick(videoData)
        return
      }
    }

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
