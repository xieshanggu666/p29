<template>
  <div class="app-container">
    <div ref="canvasContainer" class="canvas-container"></div>

    <ToolBar
      @switch-scene="handleSwitchScene"
      @save-viewpoint="handleSaveViewpoint"
      @reset-camera="handleResetCamera"
      @toggle-annotations="handleToggleAnnotations"
      @toggle-wireframe="handleToggleWireframe"
    />

    <InfoPanel
      v-if="sceneStore.hasSelection"
      :data="sceneStore.selectedObject"
      @close="sceneStore.clearSelection()"
    />

    <ScenePanel
      @switch-scene="handleSwitchScene"
      @save-viewpoint="handleSaveViewpoint"
      @restore-viewpoint="handleRestoreViewpoint"
      @delete-viewpoint="handleDeleteViewpoint"
    />

    <PerformancePanel v-if="sceneStore.performanceStats" :stats="sceneStore.performanceStats" />

    <div v-if="sceneStore.isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载商圈模型中...</div>
        <div class="loading-bar">
          <div class="loading-bar-fill" :style="{ width: sceneStore.loadingProgress + '%' }"></div>
        </div>
        <div class="loading-percent">{{ sceneStore.loadingProgress }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useThreeScene } from './composables/useThreeScene.js'
import { useSceneStore } from './store/sceneStore.js'
import ToolBar from './components/ToolBar.vue'
import InfoPanel from './components/InfoPanel.vue'
import ScenePanel from './components/ScenePanel.vue'
import PerformancePanel from './components/PerformancePanel.vue'

const canvasContainer = ref(null)
const sceneStore = useSceneStore()

const {
  init,
  switchScene,
  saveViewpoint,
  restoreViewpoint,
  deleteViewpoint,
  toggleAnnotations,
  toggleWireframe,
  resetCamera,
  dispose,
} = useThreeScene()

onMounted(() => {
  if (canvasContainer.value) {
    init(canvasContainer.value)
  }
})

onBeforeUnmount(() => {
  dispose()
})

function handleSwitchScene(key) { switchScene(key) }
function handleSaveViewpoint(name) { saveViewpoint(name) }
function handleRestoreViewpoint(name) { restoreViewpoint(name) }
function handleDeleteViewpoint(name) { deleteViewpoint(name) }
function handleResetCamera() { resetCamera() }
function handleToggleAnnotations() { toggleAnnotations() }
function handleToggleWireframe() { toggleWireframe() }
</script>

<style>
.app-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #1a1a2e;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 10, 20, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  color: #e0e0e0;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(100, 140, 255, 0.2);
  border-top-color: #648cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  margin-bottom: 16px;
  color: #a0b0ff;
}

.loading-bar {
  width: 200px;
  height: 4px;
  background: rgba(100, 140, 255, 0.2);
  border-radius: 2px;
  margin: 0 auto 8px;
  overflow: hidden;
}

.loading-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #648cff, #a0b0ff);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.loading-percent {
  font-size: 12px;
  color: #8090cc;
}
</style>
