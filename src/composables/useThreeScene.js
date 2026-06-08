import * as THREE from 'three'
import { ref, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { SceneManager } from '../three/core/SceneManager.js'
import { InteractionManager } from '../three/managers/InteractionManager.js'
import { ViewpointManager } from '../three/managers/ViewpointManager.js'
import { AnnotationManager } from '../three/managers/AnnotationManager.js'
import { PerformanceManager } from '../three/managers/PerformanceManager.js'
import { DistrictModelBuilder } from '../three/builders/DistrictModelBuilder.js'
import { districtConfig, annotationData, scenePresets } from '../config/districtData.js'
import { useSceneStore } from '../store/sceneStore.js'
import { useViewpointStore } from '../store/viewpointStore.js'

export function useThreeScene() {
  const containerRef = ref(null)
  const sceneManager = shallowRef(null)
  const interactionManager = shallowRef(null)
  const viewpointManager = shallowRef(null)
  const annotationManager = shallowRef(null)
  const performanceManager = shallowRef(null)
  const modelBuilder = shallowRef(null)

  const sceneStore = useSceneStore()
  const viewpointStore = useViewpointStore()

  let perfTimer = null

  function init(container) {
    containerRef.value = container
    sceneManager.value = new SceneManager(container)
    sceneStore.setLoading(true)

    modelBuilder.value = new DistrictModelBuilder(sceneManager.value.scene)

    sceneManager.value.addUpdateCallback((delta, elapsed) => {
      if (modelBuilder.value) modelBuilder.value.updateAnimation(delta, elapsed)
      if (annotationManager.value) annotationManager.value.updateAnimation(elapsed)
    })

    interactionManager.value = new InteractionManager(sceneManager.value, (obj, point) => {
      if (obj) {
        sceneStore.setSelectedObject({
          id: obj.userData.buildingId || obj.userData.roadId || obj.userData.greeneryId || obj.userData.annotationId,
          name: obj.userData.buildingName || obj.userData.roadName || obj.userData.annotationData?.title || '',
          type: obj.userData.buildingType || obj.userData.roadType || obj.userData.category || '',
          info: obj.userData.buildingInfo || obj.userData.annotationData || {},
          point: point ? { x: point.x, y: point.y, z: point.z } : null,
        })
      } else {
        sceneStore.clearSelection()
      }
    })

    viewpointManager.value = new ViewpointManager(sceneManager.value)
    syncViewpoints()

    annotationManager.value = new AnnotationManager(sceneManager.value)
    for (const ann of annotationData) {
      annotationManager.value.add(ann.id, ann.position, { title: ann.title, content: ann.content }, ann.color)
    }

    performanceManager.value = new PerformanceManager(sceneManager.value)

    loadDistrict()

    sceneManager.value.start()
    startPerfMonitor()

    sceneStore.setLoaded(true)
    sceneStore.setLoading(false)
  }

  function loadDistrict() {
    sceneStore.setLoadingProgress(0)

    modelBuilder.value.buildDistrict(districtConfig)
    sceneStore.setLoadingProgress(50)

    sceneStore.setLoadingProgress(100)
  }

  function switchScene(presetKey) {
    const preset = scenePresets[presetKey]
    if (!preset) return

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

  function startPerfMonitor() {
    perfTimer = setInterval(() => {
      if (!performanceManager.value) return
      const report = performanceManager.value.getReport()
      sceneStore.setFps(report.fps)
      sceneStore.setLodLevel(report.lod)
      sceneStore.setPerformanceStats(report)

      if (report.averageFps < 30) {
        performanceManager.value.autoAdjustLOD()
      }
    }, 1000)
  }

  function dispose() {
    if (perfTimer) clearInterval(perfTimer)
    if (interactionManager.value) interactionManager.value.dispose()
    if (annotationManager.value) annotationManager.value.dispose()
    if (viewpointManager.value) viewpointManager.value.dispose()
    if (performanceManager.value) performanceManager.value.dispose()
    if (modelBuilder.value) modelBuilder.value.dispose()
    if (sceneManager.value) sceneManager.value.dispose()
  }

  return {
    containerRef,
    sceneManager,
    init,
    switchScene,
    saveViewpoint,
    restoreViewpoint,
    deleteViewpoint,
    toggleAnnotations,
    toggleWireframe,
    resetCamera,
    dispose,
  }
}
