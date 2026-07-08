import * as THREE from 'three'

const getCameraLookAt = (gaussianViewer) => {
  const camera = gaussianViewer?.camera
  const controls = gaussianViewer?.controls
  if (!camera) {
    return null
  }

  if (controls?.target?.clone) {
    return controls.target.clone()
  }

  const direction = new THREE.Vector3()
  camera.getWorldDirection(direction)
  return camera.position.clone().add(direction)
}

export const disableBuiltInKeyboardPan = (gaussianViewer) => {
  const safelyStopKeyEvents = (controls) => {
    if (!controls?._domElementKeyEvents || typeof controls.stopListenToKeyEvents !== 'function') {
      return
    }

    controls.stopListenToKeyEvents()
  }

  safelyStopKeyEvents(gaussianViewer?.controls)
  safelyStopKeyEvents(gaussianViewer?.perspectiveControls)
  safelyStopKeyEvents(gaussianViewer?.orthographicControls)
}

export const setupKeyboardHorizontalMovement = ({
  gaussianViewer,
  sceneStore,
  sceneResources,
  addTrackedEventListener,
  speed = 2.4
}) => {
  if (typeof window === 'undefined' || !gaussianViewer?.camera) {
    return
  }

  const isMovementLocked = () => sceneStore.interactionLocked && !sceneStore.debugMode
  const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD'])
  const activeKeys = new Set()
  const moveDirection = new THREE.Vector3()
  const forward = new THREE.Vector3()
  const right = new THREE.Vector3()
  const worldUp = new THREE.Vector3()
  const fallbackForward = new THREE.Vector3(0, 0, -1)
  let lastFrameTime = 0

  const moveCameraHorizontally = (deltaSeconds) => {
    if (isMovementLocked()) {
      return false
    }

    const camera = gaussianViewer.camera
    const controls = gaussianViewer.controls
    const lookAt = getCameraLookAt(gaussianViewer)
    if (!camera || !lookAt || activeKeys.size === 0) {
      return false
    }

    worldUp.copy(camera.up).normalize()

    forward.copy(lookAt).sub(camera.position).projectOnPlane(worldUp)
    if (forward.lengthSq() === 0) {
      forward.copy(fallbackForward).projectOnPlane(worldUp)
    }
    if (forward.lengthSq() === 0) {
      return false
    }
    forward.normalize()

    right.setFromMatrixColumn(camera.matrixWorld, 0).projectOnPlane(worldUp)
    if (right.lengthSq() === 0) {
      right.crossVectors(forward, worldUp)
    }
    if (right.lengthSq() === 0) {
      return false
    }
    right.normalize()

    moveDirection.set(0, 0, 0)

    if (activeKeys.has('KeyW')) moveDirection.add(forward)
    if (activeKeys.has('KeyS')) moveDirection.sub(forward)
    if (activeKeys.has('KeyA')) moveDirection.sub(right)
    if (activeKeys.has('KeyD')) moveDirection.add(right)

    if (moveDirection.lengthSq() === 0) {
      return false
    }
    const moveDistance = speed * deltaSeconds

    moveDirection.normalize().multiplyScalar(moveDistance)
    camera.position.add(moveDirection)

    if (controls?.target) {
      controls.target.add(moveDirection)
      controls.update?.()
    } else {
      lookAt.add(moveDirection)
      camera.lookAt(lookAt)
    }

    camera.updateMatrixWorld?.(true)
    gaussianViewer.forceRenderNextFrame?.()
    return true
  }

  const stopMovementLoop = () => {
    if (sceneResources.value.keyboardAnimationFrame) {
      cancelAnimationFrame(sceneResources.value.keyboardAnimationFrame)
      sceneResources.value.keyboardAnimationFrame = null
    }
    lastFrameTime = 0
  }

  sceneResources.value.stopKeyboardMovement = stopMovementLoop

  const startMovementLoop = () => {
    if (sceneResources.value.keyboardAnimationFrame) {
      return
    }

    const tick = (currentTime) => {
      if (isMovementLocked()) {
        activeKeys.clear()
        stopMovementLoop()
        return
      }

      if (activeKeys.size === 0) {
        stopMovementLoop()
        return
      }

      const elapsed = lastFrameTime ? currentTime - lastFrameTime : 16.67
      lastFrameTime = currentTime
      const deltaSeconds = Math.min(elapsed, 32) / 1000

      moveCameraHorizontally(deltaSeconds)
      sceneResources.value.keyboardAnimationFrame = requestAnimationFrame(tick)
    }

    sceneResources.value.keyboardAnimationFrame = requestAnimationFrame(tick)
  }

  const handleKeyDown = (event) => {
    if (isMovementLocked()) {
      return
    }

    if (!movementKeys.has(event.code)) {
      return
    }

    event.preventDefault()
    activeKeys.add(event.code)
    startMovementLoop()
  }

  const handleKeyUp = (event) => {
    if (!movementKeys.has(event.code)) {
      return
    }

    activeKeys.delete(event.code)
    if (activeKeys.size === 0) {
      stopMovementLoop()
    }
  }

  const handleWindowBlur = () => {
    activeKeys.clear()
    stopMovementLoop()
  }

  addTrackedEventListener(window, 'keydown', handleKeyDown)
  addTrackedEventListener(window, 'keyup', handleKeyUp)
  addTrackedEventListener(window, 'blur', handleWindowBlur)
}
