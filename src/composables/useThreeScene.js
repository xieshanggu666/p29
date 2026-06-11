import { onMounted, onBeforeUnmount } from 'vue'
import { useSceneInit } from './useSceneInit.js'
import { useSceneControls } from './useSceneControls.js'
import { useScenePerformance } from './useScenePerformance.js'
import { useSceneStore } from '../store/sceneStore.js'

export function useThreeScene() {
  const sceneStore = useSceneStore()

  const {
    containerRef,
    sceneManager,
    viewpointManager,
    annotationManager,
    performanceManager,
    weatherManager,
    modelBuilder,
    initManagers,
    loadDistrict,
    dispose: disposeInit,
  } = useSceneInit()

  const {
    switchScene,
    saveViewpoint,
    restoreViewpoint,
    deleteViewpoint,
    syncViewpoints,
    toggleAnnotations,
    toggleWireframe,
    resetCamera,
    changeWeather,
  } = useSceneControls(sceneManager, viewpointManager, annotationManager, weatherManager)

  function toggleInteriorView() {
    sceneStore.toggleInteriorView()
    if (modelBuilder.value) {
      modelBuilder.value.setInteriorView(sceneStore.interiorView)
    }
  }

  const {
    startPerfMonitor,
    stopPerfMonitor,
    runPerformanceBenchmark,
    getDeviceCompatibilityInfo,
  } = useScenePerformance(performanceManager, modelBuilder)

  function init(container) {
    initManagers(container)

    sceneManager.value.addUpdateCallback((delta, elapsed) => {
      if (modelBuilder.value) modelBuilder.value.updateAnimation(delta, elapsed)
      if (annotationManager.value) annotationManager.value.updateAnimation(elapsed)
      if (weatherManager.value) weatherManager.value.update(delta, elapsed)
    })

    syncViewpoints()
    loadDistrict()

    sceneManager.value.start()
    startPerfMonitor()

    sceneStore.setLoaded(true)
    sceneStore.setLoading(false)
  }

  function dispose() {
    stopPerfMonitor()
    disposeInit()
  }

  onBeforeUnmount(() => {
    dispose()
  })

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
    toggleInteriorView,
    resetCamera,
    changeWeather,
    runPerformanceBenchmark,
    getDeviceCompatibilityInfo,
    dispose,
  }
}
