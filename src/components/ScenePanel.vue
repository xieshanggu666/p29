<template>
  <div class="scene-panel">
    <button class="toggle-btn" @click="isOpen = !isOpen">
      <span class="toggle-icon">{{ isOpen ? '◀' : '▶' }}</span>
      <span class="toggle-text">场景</span>
    </button>

    <div v-if="isOpen" class="panel-content">
      <h4 class="section-title">预设场景</h4>
      <div class="scene-list">
        <button
          v-for="(preset, key) in presets"
          :key="key"
          class="scene-item"
          :class="{ active: sceneStore.currentScene === key }"
          @click="$emit('switch-scene', key)"
        >
          {{ preset.name }}
        </button>
      </div>

      <h4 class="section-title">保存的视角</h4>
      <div v-if="viewpointStore.viewpoints.length === 0" class="empty-hint">
        暂无保存的视角
      </div>
      <div v-else class="viewpoint-list">
        <div
          v-for="vp in viewpointStore.viewpointList"
          :key="vp.name"
          class="viewpoint-item"
        >
          <div class="vp-info" @click="$emit('restore-viewpoint', vp.name)">
            <span class="vp-name">{{ vp.name }}</span>
            <span class="vp-time">{{ vp.formattedTime }}</span>
          </div>
          <button class="vp-delete" @click="$emit('delete-viewpoint', vp.name)">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSceneStore } from '../store/sceneStore.js'
import { useViewpointStore } from '../store/viewpointStore.js'
import { scenePresets } from '../config/districtData.js'

const sceneStore = useSceneStore()
const viewpointStore = useViewpointStore()
const presets = scenePresets
const isOpen = ref(true)

defineEmits(['switch-scene', 'save-viewpoint', 'restore-viewpoint', 'delete-viewpoint'])
</script>

<style scoped>
.scene-panel {
  position: absolute;
  left: 20px;
  top: 70px;
  z-index: 150;
  display: flex;
  align-items: flex-start;
}

.toggle-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  background: rgba(40, 50, 80, 0.8);
  border: 1px solid rgba(100, 140, 255, 0.3);
  border-radius: 6px;
  color: #a0b0ff;
  cursor: pointer;
  margin-right: 8px;
}

.toggle-btn:hover {
  background: rgba(60, 80, 140, 0.9);
}

.toggle-icon {
  font-size: 12px;
}

.toggle-text {
  font-size: 10px;
  writing-mode: vertical-rl;
}

.panel-content {
  width: 200px;
  background: rgba(15, 18, 35, 0.95);
  border: 1px solid rgba(100, 140, 255, 0.3);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  padding: 14px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.section-title {
  font-size: 12px;
  color: #8090cc;
  margin: 0 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(100, 140, 255, 0.15);
}

.section-title:last-of-type {
  margin-top: 14px;
}

.scene-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.scene-item {
  padding: 5px 10px;
  background: rgba(40, 50, 80, 0.6);
  border: 1px solid rgba(100, 140, 255, 0.2);
  border-radius: 5px;
  color: #b0c0ee;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scene-item:hover {
  background: rgba(60, 80, 140, 0.8);
  border-color: rgba(100, 140, 255, 0.5);
}

.scene-item.active {
  background: rgba(80, 100, 180, 0.8);
  border-color: #648cff;
  color: #ffffff;
}

.empty-hint {
  font-size: 12px;
  color: #6070a0;
  padding: 8px 0;
}

.viewpoint-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.viewpoint-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: rgba(40, 50, 80, 0.4);
  border-radius: 5px;
  transition: background 0.2s ease;
}

.viewpoint-item:hover {
  background: rgba(60, 80, 140, 0.6);
}

.vp-info {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.vp-name {
  display: block;
  font-size: 12px;
  color: #c0d0f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vp-time {
  display: block;
  font-size: 10px;
  color: #6070a0;
  margin-top: 1px;
}

.vp-delete {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #6070a0;
  font-size: 14px;
  cursor: pointer;
  border-radius: 3px;
  flex-shrink: 0;
}

.vp-delete:hover {
  background: rgba(255, 80, 80, 0.3);
  color: #ff8080;
}
</style>
