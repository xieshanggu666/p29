import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useViewpointStore = defineStore('viewpoint', () => {
  const viewpoints = ref([])
  const currentViewpointName = ref('')

  const viewpointList = computed(() =>
    viewpoints.value.map(vp => ({
      ...vp,
      formattedTime: new Date(vp.timestamp).toLocaleString('zh-CN')
    }))
  )

  function setViewpoints(list) { viewpoints.value = list }
  function addViewpoint(vp) { viewpoints.value.push(vp) }
  function removeViewpoint(name) {
    viewpoints.value = viewpoints.value.filter(v => v.name !== name)
  }
  function setCurrentName(name) { currentViewpointName.value = name }

  return { viewpoints, currentViewpointName, viewpointList, setViewpoints, addViewpoint, removeViewpoint, setCurrentName }
})
