<template>
  <div class="weather-selector">
    <div 
      class="weather-trigger"
      @click="toggleDropdown"
      :class="{ active: isDropdownOpen }"
    >
      <span class="weather-icon">{{ currentWeatherData.icon }}</span>
      <span class="weather-label">{{ currentWeatherData.label }}</span>
      <span class="weather-arrow">{{ isDropdownOpen ? '▲' : '▼' }}</span>
    </div>
    
    <Transition name="dropdown">
      <div v-if="isDropdownOpen" class="weather-dropdown">
        <button
          v-for="weather in weatherOptions"
          :key="weather.key"
          class="weather-option"
          :class="{ 
            active: sceneStore.currentWeather === weather.key,
            transitioning: sceneStore.isWeatherTransitioning
          }"
          @click="selectWeather(weather.key)"
          :disabled="sceneStore.isWeatherTransitioning"
        >
          <span class="option-icon">{{ weather.icon }}</span>
          <span class="option-label">{{ weather.label }}</span>
          <span v-if="sceneStore.currentWeather === weather.key" class="option-check">✓</span>
        </button>
      </div>
    </Transition>
    
    <Transition name="fade">
      <div v-if="sceneStore.isWeatherTransitioning" class="weather-transition-overlay">
        <div class="transition-spinner"></div>
        <div class="transition-text">切换天气中...</div>
      </div>
    </Transition>
    
    <Transition name="toast">
      <div v-if="showToast" class="weather-toast">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSceneStore } from '../store/sceneStore.js'

const sceneStore = useSceneStore()
const isDropdownOpen = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

const emit = defineEmits(['change-weather'])

const currentWeatherData = computed(() => {
  return sceneStore.weatherOptions.find(w => w.key === sceneStore.currentWeather) || sceneStore.weatherOptions[0]
})

const weatherOptions = computed(() => sceneStore.weatherOptions)

function toggleDropdown() {
  if (!sceneStore.isWeatherTransitioning) {
    isDropdownOpen.value = !isDropdownOpen.value
  }
}

async function selectWeather(weatherKey) {
  if (sceneStore.isWeatherTransitioning || sceneStore.currentWeather === weatherKey) return
  
  sceneStore.setWeatherTransitioning(true)
  isDropdownOpen.value = false
  
  await new Promise(resolve => setTimeout(resolve, 300))
  
  emit('change-weather', weatherKey)
  
  setTimeout(() => {
    sceneStore.setWeatherTransitioning(false)
    showToastMessage(`已切换到${weatherOptions.value.find(w => w.key === weatherKey)?.label}`)
  }, 800)
}

function showToastMessage(message) {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

function handleClickOutside(event) {
  const selector = event.target.closest('.weather-selector')
  if (!selector) {
    isDropdownOpen.value = false
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('click', handleClickOutside)
}
</script>

<style scoped>
.weather-selector {
  position: relative;
  display: inline-block;
}

.weather-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(40, 50, 80, 0.9);
  border: 1px solid rgba(100, 140, 255, 0.3);
  border-radius: 8px;
  color: #c0d0ff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.weather-trigger:hover {
  background: rgba(60, 80, 140, 0.95);
  border-color: rgba(100, 140, 255, 0.6);
}

.weather-trigger.active {
  background: rgba(80, 100, 180, 0.95);
  border-color: #648cff;
  color: #ffffff;
}

.weather-icon {
  font-size: 18px;
}

.weather-label {
  font-weight: 500;
}

.weather-arrow {
  font-size: 10px;
  opacity: 0.7;
  transition: transform 0.3s ease;
}

.weather-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 140px;
  background: rgba(20, 25, 45, 0.98);
  border: 1px solid rgba(100, 140, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 1000;
}

.weather-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: #b0c0e0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.weather-option:hover {
  background: rgba(80, 100, 180, 0.6);
  color: #ffffff;
}

.weather-option.active {
  background: rgba(100, 140, 255, 0.3);
  color: #ffffff;
}

.weather-option.transitioning {
  pointer-events: none;
  opacity: 0.5;
}

.option-icon {
  font-size: 18px;
}

.option-label {
  flex: 1;
}

.option-check {
  font-size: 12px;
  color: #648cff;
}

.weather-transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 30, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  pointer-events: none;
}

.transition-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(100, 140, 255, 0.2);
  border-top-color: #648cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.transition-text {
  margin-top: 16px;
  color: #a0b0ff;
  font-size: 14px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.weather-toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: rgba(80, 100, 180, 0.95);
  border: 1px solid rgba(100, 140, 255, 0.5);
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  z-index: 3000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.25s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

@media (max-width: 768px) {
  .weather-trigger {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .weather-icon {
    font-size: 16px;
  }
  
  .weather-label {
    display: none;
  }
  
  .weather-dropdown {
    min-width: 120px;
  }
  
  .weather-option {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .weather-toast {
    bottom: 20px;
    padding: 10px 20px;
    font-size: 12px;
  }
}
</style>
