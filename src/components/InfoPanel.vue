<template>
  <div class="info-panel">
    <div class="panel-header">
      <h3 class="panel-title">{{ data.name }}</h3>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
    <div class="panel-body">
      <div class="info-type">
        <span class="type-badge" :class="typeClass">{{ typeLabel }}</span>
      </div>

      <div v-if="data.info && data.info.area" class="info-grid">
        <div class="info-item">
          <span class="info-label">建筑面积</span>
          <span class="info-value">{{ formatNumber(data.info.area) }} ㎡</span>
        </div>
        <div class="info-item">
          <span class="info-label">入驻率</span>
          <span class="info-value occupancy">
            <span class="occupancy-bar">
              <span class="occupancy-fill" :style="{ width: (data.info.occupancy * 100) + '%' }"></span>
            </span>
            {{ (data.info.occupancy * 100).toFixed(0) }}%
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">主营业务</span>
          <span class="info-value">{{ data.info.mainBusiness }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">日均客流</span>
          <span class="info-value">{{ formatNumber(data.info.dailyFlow) }} 人次</span>
        </div>
        <div class="info-item">
          <span class="info-label">平均租金</span>
          <span class="info-value highlight">{{ data.info.avgRent }} 元/㎡/天</span>
        </div>
        <div class="info-item">
          <span class="info-label">开发商</span>
          <span class="info-value">{{ data.info.developer }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">开业年份</span>
          <span class="info-value">{{ data.info.openYear }}</span>
        </div>
      </div>

      <div v-else-if="data.info && data.info.content" class="info-simple">
        <p class="info-content">{{ data.info.content }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
})

defineEmits(['close'])

const typeLabel = computed(() => {
  const map = { commercial: '商业', office: '办公', residential: '住宅', retail: '零售', main: '主路', secondary: '支路', tree: '绿化', park: '公园', lawn: '草坪' }
  return map[props.data.type] || props.data.type
})

const typeClass = computed(() => {
  const map = { commercial: 'type-commercial', office: 'type-office', residential: 'type-residential', retail: 'type-retail' }
  return map[props.data.type] || ''
})

function formatNumber(num) {
  if (!num) return '0'
  return num.toLocaleString('zh-CN')
}
</script>

<style scoped>
.info-panel {
  position: absolute;
  top: 70px;
  right: 20px;
  width: 320px;
  background: rgba(15, 18, 35, 0.95);
  border: 1px solid rgba(100, 140, 255, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  z-index: 200;
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: rgba(40, 50, 90, 0.5);
  border-bottom: 1px solid rgba(100, 140, 255, 0.2);
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #e0e8ff;
}

.close-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid rgba(100, 140, 255, 0.3);
  border-radius: 4px;
  color: #8090cc;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(255, 80, 80, 0.3);
  border-color: rgba(255, 80, 80, 0.5);
  color: #ff8080;
}

.panel-body {
  padding: 14px 16px;
}

.info-type {
  margin-bottom: 12px;
}

.type-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(100, 140, 255, 0.2);
  color: #a0b8ff;
}

.type-badge.type-commercial { background: rgba(68, 136, 204, 0.3); color: #88bbff; }
.type-badge.type-office { background: rgba(102, 153, 187, 0.3); color: #99ccee; }
.type-badge.type-residential { background: rgba(221, 170, 119, 0.3); color: #eebb88; }
.type-badge.type-retail { background: rgba(204, 102, 68, 0.3); color: #ee8866; }

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-label {
  font-size: 12px;
  color: #8090bb;
  flex-shrink: 0;
}

.info-value {
  font-size: 13px;
  color: #d0d8f0;
  text-align: right;
}

.info-value.highlight {
  color: #ffcc44;
  font-weight: 600;
}

.occupancy {
  display: flex;
  align-items: center;
  gap: 8px;
}

.occupancy-bar {
  width: 60px;
  height: 6px;
  background: rgba(100, 140, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.occupancy-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #648cff, #44ff88);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.info-simple {
  padding: 4px 0;
}

.info-content {
  font-size: 13px;
  color: #c0ccf0;
  line-height: 1.6;
  margin: 0;
}
</style>
