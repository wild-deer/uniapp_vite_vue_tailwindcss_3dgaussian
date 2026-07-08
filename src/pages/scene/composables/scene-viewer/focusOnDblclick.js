import * as THREE from 'three'

export const setupViewerFocusOnDoubleClick = ({
  gaussianViewer,
  threeScene,
  sceneStore,
  addTrackedEventListener
}) => {
  const domElement = gaussianViewer?.renderer?.domElement
  const pointerUpListener = gaussianViewer?.mouseUpListener
  if (!domElement) {
    return
  }

  if (pointerUpListener) {
    domElement.removeEventListener('pointerup', pointerUpListener, false)
  }

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const getInteractiveBillboards = () =>
    threeScene.children.filter(
      (child) => child.userData?.isBillboard && child.userData?.cameraView
    )

  const handleDoubleClickFocus = (event) => {
    if (sceneStore.interactionLocked && !sceneStore.debugMode) {
      return
    }

    const rect = domElement.getBoundingClientRect()
    if (rect.width && rect.height && gaussianViewer?.camera) {
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, gaussianViewer.camera)

      const billboardHits = raycaster.intersectObjects(getInteractiveBillboards(), false)
      if (billboardHits.length > 0) {
        return
      }
    }

    gaussianViewer?.onMouseClick?.(event)
  }

  addTrackedEventListener(domElement, 'dblclick', handleDoubleClickFocus)
}
