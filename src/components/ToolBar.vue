<template>
  <div class="toolbar">
    <div class="toolbar-group">
      <button class="toolbar-btn" @click="$emit('reset-camera')" title="重置视角">
        <span class="icon">🏠</span>
        <span class="label">重置</span>
      </button>
      <button
        class="toolbar-btn"
        :class="{ active: sceneStore.showAnnotations }"
        @click="$emit('toggle-annotations')"
        title="切换标注"
      >
        <span class="icon">📍</span>
        <span class="label">标注</span>
      </button>
      <button
        class="toolbar-btn"
        :class="{ active: sceneStore.wireframeMode }"
        @click="$emit('toggle-wireframe')"
        title="线框模式"
      >
        <span class="icon">🔲</span>
        <span class="label">线框</span>
      </button>
    </div>

    <div class="toolbar-group">
      <button class="toolbar-btn scene-btn" @click="$emit('switch-scene', 'overview')">
        <span class="label">总览</span>
      </button>
      <button class="toolbar-btn scene-btn" @click="$emit('switch-scene', 'commercial')">
        <span class="label">商业</span>
      </button>
      <button class="toolbar-btn scene-btn" @click="$emit('switch-scene', 'office')">
        <span class="label">办公</span>
      </button>
      <button class="toolbar-btn scene-btn" @click="$emit('switch-scene', 'residential')">
        <span class="label">住宅</span>
      </button>
      <button class="toolbar-btn scene-btn" @click="$emit('switch-scene', 'dining')">
        <span class="label">美食</span>
      </button>
    </div>

    <div class="toolbar-group">
      <div class="save-viewpoint">
        <input
          v-model="viewpointName"
          class="viewpoint-input"
          placeholder="输入视角名称"
          @keyup.enter="handleSave"
        />
        <button class="toolbar-btn" @click="handleSave" title="保存当前视角">
          <span class="icon">💾</span>
          <span class="label">保存视角</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSceneStore } from '../store/sceneStore.js'

const sceneStore = useSceneStore()
const viewpointName = ref('')

const emit = defineEmits([
  'switch-scene',
  'save-viewpoint',
  'reset-camera',
  'toggle-annotations',
  'toggle-wireframe',
])

function handleSave() {
  const name = viewpointName.value.trim()
  if (!name) return
  emit('save-viewpoint', name)
  viewpointName.value = ''
}
</script>

<style scoped>
.toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(180deg, rgba(10, 10, 30, 0.9) 0%, rgba(10, 10, 30, 0.0) 100%);
  z-index: 100;
  pointer-events: none;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: all;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(40, 50, 80, 0.8);
  border: 1px solid rgba(100, 140, 255, 0.3);
  border-radius: 6px;
  color: #c0d0ff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toolbar-btn:hover {
  background: rgba(60, 80, 140, 0.9);
  border-color: rgba(100, 140, 255, 0.6);
}

.toolbar-btn.active {
  background: rgba(80, 100, 180, 0.9);
  border-color: #648cff;
  color: #ffffff;
}

.toolbar-btn .icon {
  font-size: 14px;
}

.scene-btn {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
}

.save-viewpoint {
  display: flex;
  align-items: center;
  gap: 6px;
}

.viewpoint-input {
  padding: 6px 10px;
  background: rgba(30, 35, 60, 0.9);
  border: 1px solid rgba(100, 140, 255, 0.3);
  border-radius: 6px;
  color: #c0d0ff;
  font-size: 12px;
  width: 120px;
  outline: none;
}

.viewpoint-input::placeholder {
  color: rgba(160, 180, 255, 0.4);
}

.viewpoint-input:focus {
  border-color: #648cff;
}
</style>
