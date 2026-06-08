<template>
  <div class="perf-panel">
    <div class="perf-row">
      <span class="perf-label">FPS</span>
      <span class="perf-value" :class="fpsClass">{{ stats.fps }}</span>
    </div>
    <div class="perf-row">
      <span class="perf-label">LOD</span>
      <span class="perf-value">{{ stats.lod }}</span>
    </div>
    <div class="perf-row">
      <span class="perf-label">三角面</span>
      <span class="perf-value">{{ formatNum(stats.scene?.triangles) }}</span>
    </div>
    <div v-if="stats.memory" class="perf-row">
      <span class="perf-label">内存</span>
      <span class="perf-value">{{ stats.memory.used }}MB</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: { type: Object, required: true },
})

const fpsClass = computed(() => {
  const fps = props.stats.fps
  if (fps >= 50) return 'fps-good'
  if (fps >= 30) return 'fps-ok'
  return 'fps-bad'
})

function formatNum(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return n.toString()
}
</script>

<style scoped>
.perf-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(15, 18, 35, 0.85);
  border: 1px solid rgba(100, 140, 255, 0.2);
  border-radius: 8px;
  padding: 10px 14px;
  z-index: 100;
  min-width: 130px;
  backdrop-filter: blur(6px);
}

.perf-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 0;
}

.perf-label {
  font-size: 11px;
  color: #6070a0;
}

.perf-value {
  font-size: 12px;
  color: #c0d0f0;
  font-variant-numeric: tabular-nums;
}

.fps-good { color: #44ff88; }
.fps-ok { color: #ffcc44; }
.fps-bad { color: #ff4444; }
</style>
