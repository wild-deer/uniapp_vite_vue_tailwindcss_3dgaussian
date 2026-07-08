import { ref } from 'vue'

export const createViewerLocker = ({ viewerRef, sceneResources }) => {
  const viewerInteractionSnapshot = ref({
    pointerEvents: null,
    controls: null
  })

  const setViewerInteractionLocked = (locked) => {
    const gaussianViewer = viewerRef.value
    const domElement = gaussianViewer?.renderer?.domElement
    const controlsList = [
      gaussianViewer?.controls,
      gaussianViewer?.perspectiveControls,
      gaussianViewer?.orthographicControls
    ].filter(Boolean)

    if (!locked) {
      if (domElement && viewerInteractionSnapshot.value.pointerEvents !== null) {
        domElement.style.pointerEvents = viewerInteractionSnapshot.value.pointerEvents || ''
      }

      const savedControls = viewerInteractionSnapshot.value.controls
      if (savedControls) {
        for (const controls of controlsList) {
          const saved = savedControls.get(controls)
          if (saved) {
            Object.entries(saved).forEach(([key, value]) => {
              if (key in controls) controls[key] = value
            })
          }
        }
      }

      viewerInteractionSnapshot.value.controls = null
      viewerInteractionSnapshot.value.pointerEvents = null
      return
    }

    if (domElement) {
      if (viewerInteractionSnapshot.value.pointerEvents === null) {
        viewerInteractionSnapshot.value.pointerEvents = domElement.style.pointerEvents ?? ''
      }
      domElement.style.pointerEvents = 'none'
    }

    if (!viewerInteractionSnapshot.value.controls) {
      viewerInteractionSnapshot.value.controls = new Map()
      for (const controls of controlsList) {
        viewerInteractionSnapshot.value.controls.set(controls, {
          enabled: 'enabled' in controls ? controls.enabled : undefined,
          enableRotate: 'enableRotate' in controls ? controls.enableRotate : undefined,
          enableZoom: 'enableZoom' in controls ? controls.enableZoom : undefined,
          enablePan: 'enablePan' in controls ? controls.enablePan : undefined
        })
      }
    }

    for (const controls of controlsList) {
      if ('enabled' in controls) controls.enabled = false
      if ('enableRotate' in controls) controls.enableRotate = false
      if ('enableZoom' in controls) controls.enableZoom = false
      if ('enablePan' in controls) controls.enablePan = false
    }

    sceneResources.value.stopKeyboardMovement?.()
  }

  return { setViewerInteractionLocked }
}
