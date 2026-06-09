import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSceneStore = defineStore('scene', () => {
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const loadingProgress = ref(0)
  const currentScene = ref('overview')
  const selectedObject = ref(null)
  const hoveredObject = ref(null)
  const showAnnotations = ref(true)
  const showGrid = ref(true)
  const wireframeMode = ref(false)
  const fps = ref(60)
  const lodLevel = ref('high')
  const performanceStats = ref(null)
  
  const currentWeather = ref('sunny')
  const isWeatherTransitioning = ref(false)
  const weatherTransitionProgress = ref(0)

  const hasSelection = computed(() => selectedObject.value !== null)

  const weatherOptions = [
    { key: 'sunny', label: '晴天', icon: '☀️' },
    { key: 'cloudy', label: '多云', icon: '⛅' },
    { key: 'overcast', label: '阴天', icon: '☁️' },
    { key: 'rainy', label: '雨天', icon: '🌧️' },
    { key: 'snowy', label: '雪天', icon: '❄️' },
  ]

  function setLoaded(val) { isLoaded.value = val }
  function setLoading(val) { isLoading.value = val }
  function setLoadingProgress(val) { loadingProgress.value = val }
  function setCurrentScene(val) { currentScene.value = val }
  function setSelectedObject(obj) { selectedObject.value = obj }
  function setHoveredObject(obj) { hoveredObject.value = obj }
  function toggleAnnotations() { showAnnotations.value = !showAnnotations.value }
  function toggleGrid() { showGrid.value = !showGrid.value }
  function toggleWireframe() { wireframeMode.value = !wireframeMode.value }
  function setFps(val) { fps.value = val }
  function setLodLevel(val) { lodLevel.value = val }
  function setPerformanceStats(val) { performanceStats.value = val }
  function clearSelection() { selectedObject.value = null }
  
  function setCurrentWeather(val) { 
    currentWeather.value = val 
  }
  function setWeatherTransitioning(val) { 
    isWeatherTransitioning.value = val 
  }
  function setWeatherTransitionProgress(val) { 
    weatherTransitionProgress.value = val 
  }

  return {
    isLoaded, isLoading, loadingProgress, currentScene,
    selectedObject, hoveredObject, showAnnotations, showGrid,
    wireframeMode, fps, lodLevel, performanceStats, hasSelection,
    currentWeather, isWeatherTransitioning, weatherTransitionProgress, weatherOptions,
    setLoaded, setLoading, setLoadingProgress, setCurrentScene,
    setSelectedObject, setHoveredObject, toggleAnnotations, toggleGrid,
    toggleWireframe, setFps, setLodLevel, setPerformanceStats, clearSelection,
    setCurrentWeather, setWeatherTransitioning, setWeatherTransitionProgress,
  }
})
