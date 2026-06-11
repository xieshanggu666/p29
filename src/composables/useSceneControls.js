import * as THREE from 'three'
import { scenePresets } from '../config/districtData.js'
import { useSceneStore } from '../store/sceneStore.js'
import { useViewpointStore } from '../store/viewpointStore.js'

export function useSceneControls(sceneManager, viewpointManager, annotationManager, weatherManager) {
  const sceneStore = useSceneStore()
  const viewpointStore = useViewpointStore()

  function switchScene(presetKey) {
    const preset = scenePresets[presetKey]
    if (!preset || !sceneManager.value) return

    const camera = sceneManager.value.camera
    const controls = sceneManager.value.controls
    const startPos = camera.position.clone()
    const endPos = new THREE.Vector3().fromArray(preset.position)
    const startTarget = controls.target.clone()
    const endTarget = new THREE.Vector3().fromArray(preset.target)

    const duration = 1200
    const startTime = performance.now()

    const animate = () => {
      const now = performance.now()
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)

      camera.position.lerpVectors(startPos, endPos, eased)
      controls.target.lerpVectors(startTarget, endTarget, eased)
      controls.update()

      if (t < 1) requestAnimationFrame(animate)
    }
    animate()

    sceneStore.setCurrentScene(presetKey)
  }

  function saveViewpoint(name) {
    if (!name || !viewpointManager.value) return
    viewpointManager.value.save(name)
    syncViewpoints()
  }

  function restoreViewpoint(name) {
    if (!viewpointManager.value) return
    viewpointManager.value.restore(name)
    viewpointStore.setCurrentName(name)
  }

  function deleteViewpoint(name) {
    if (!viewpointManager.value) return
    viewpointManager.value.delete(name)
    syncViewpoints()
  }

  function syncViewpoints() {
    if (!viewpointManager.value) return
    const list = viewpointManager.value.getAll()
    viewpointStore.setViewpoints(list)
  }

  function toggleAnnotations() {
    sceneStore.toggleAnnotations()
    if (annotationManager.value) {
      sceneStore.showAnnotations ? annotationManager.value.showAll() : annotationManager.value.hideAll()
    }
  }

  function toggleWireframe() {
    sceneStore.toggleWireframe()
    if (!sceneManager.value) return
    sceneManager.value.scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        obj.material.wireframe = sceneStore.wireframeMode
      }
    })
  }

  function resetCamera() {
    if (!sceneManager.value) return
    const camera = sceneManager.value.camera
    const controls = sceneManager.value.controls

    const startPos = camera.position.clone()
    const endPos = new THREE.Vector3(80, 60, 80)
    const startTarget = controls.target.clone()
    const endTarget = new THREE.Vector3(0, 0, 0)

    const duration = 1000
    const startTime = performance.now()

    const animate = () => {
      const now = performance.now()
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      camera.position.lerpVectors(startPos, endPos, eased)
      controls.target.lerpVectors(startTarget, endTarget, eased)
      controls.update()
      if (t < 1) requestAnimationFrame(animate)
    }
    animate()
  }

  function changeWeather(weatherType) {
    if (!weatherManager.value) return
    weatherManager.value.setWeather(weatherType)
    sceneStore.setCurrentWeather(weatherType)
  }

  return {
    switchScene,
    saveViewpoint,
    restoreViewpoint,
    deleteViewpoint,
    syncViewpoints,
    toggleAnnotations,
    toggleWireframe,
    resetCamera,
    changeWeather,
  }
}
