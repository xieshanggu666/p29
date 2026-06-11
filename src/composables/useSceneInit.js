import { ref, shallowRef } from 'vue'
import { SceneManager } from '../three/core/SceneManager.js'
import { InteractionManager } from '../three/managers/InteractionManager.js'
import { ViewpointManager } from '../three/managers/ViewpointManager.js'
import { AnnotationManager } from '../three/managers/AnnotationManager.js'
import { PerformanceManager } from '../three/managers/PerformanceManager.js'
import { WeatherManager } from '../three/managers/WeatherManager.js'
import { DistrictModelBuilder } from '../three/builders/DistrictModelBuilder.js'
import { districtConfig, annotationData } from '../config/districtData.js'
import { useSceneStore } from '../store/sceneStore.js'

export function useSceneInit() {
  const containerRef = ref(null)
  const sceneManager = shallowRef(null)
  const interactionManager = shallowRef(null)
  const viewpointManager = shallowRef(null)
  const annotationManager = shallowRef(null)
  const performanceManager = shallowRef(null)
  const weatherManager = shallowRef(null)
  const modelBuilder = shallowRef(null)

  const sceneStore = useSceneStore()

  function initManagers(container) {
    containerRef.value = container
    sceneManager.value = new SceneManager(container)
    sceneStore.setLoading(true)

    modelBuilder.value = new DistrictModelBuilder(sceneManager.value.scene, sceneManager.value.camera)
    weatherManager.value = new WeatherManager(sceneManager.value.scene)

    interactionManager.value = new InteractionManager(sceneManager.value, (obj, point) => {
      if (obj) {
        sceneStore.setSelectedObject({
          id: obj.userData.buildingId || obj.userData.roadId || obj.userData.greeneryId || obj.userData.annotationId || obj.userData.animalId,
          name: obj.userData.buildingName || obj.userData.roadName || obj.userData.annotationData?.title || (obj.userData.category === 'bird' ? '飞鸟' : obj.userData.category === 'fish' ? '游鱼' : ''),
          type: obj.userData.buildingType || obj.userData.roadType || obj.userData.category || '',
          info: obj.userData.buildingInfo || obj.userData.annotationData || {},
          point: point ? { x: point.x, y: point.y, z: point.z } : null,
        })
      } else {
        sceneStore.clearSelection()
      }
    })

    viewpointManager.value = new ViewpointManager(sceneManager.value)
    annotationManager.value = new AnnotationManager(sceneManager.value)

    for (const ann of annotationData) {
      annotationManager.value.add(ann.id, ann.position, { title: ann.title, content: ann.content }, ann.color)
    }

    performanceManager.value = new PerformanceManager(sceneManager.value)
  }

  function loadDistrict() {
    sceneStore.setLoadingProgress(0)
    modelBuilder.value.buildDistrict(districtConfig)
    sceneStore.setLoadingProgress(50)
    sceneStore.setLoadingProgress(100)
  }

  function dispose() {
    if (interactionManager.value) interactionManager.value.dispose()
    if (annotationManager.value) annotationManager.value.dispose()
    if (viewpointManager.value) viewpointManager.value.dispose()
    if (performanceManager.value) performanceManager.value.dispose()
    if (weatherManager.value) weatherManager.value.dispose()
    if (modelBuilder.value) modelBuilder.value.dispose()
    if (sceneManager.value) sceneManager.value.dispose()
  }

  return {
    containerRef,
    sceneManager,
    interactionManager,
    viewpointManager,
    annotationManager,
    performanceManager,
    weatherManager,
    modelBuilder,
    initManagers,
    loadDistrict,
    dispose,
  }
}
