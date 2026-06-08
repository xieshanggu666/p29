import * as THREE from 'three'

export class PerformanceManager {
  constructor(sceneManager) {
    this.sceneManager = sceneManager
    this.fpsHistory = []
    this.maxHistory = 60
    this.lodLevels = { high: 0, medium: 50, low: 100 }
    this.currentLod = 'high'
    this.lastCheckTime = 0
    this.checkInterval = 1000
    this._frameCount = 0
    this._lastFrameTime = performance.now()
    this.sceneManager.addUpdateCallback(this._onUpdate.bind(this))
  }

  _onUpdate() {
    this._frameCount++
  }

  getFps() {
    const now = performance.now()
    const delta = now - this._lastFrameTime
    if (delta < 500) return this.fpsHistory.length > 0 ? this.fpsHistory[this.fpsHistory.length - 1] : 60
    const fps = Math.round((this._frameCount / delta) * 1000)
    this._frameCount = 0
    this._lastFrameTime = now
    this.fpsHistory.push(fps)
    if (this.fpsHistory.length > this.maxHistory) {
      this.fpsHistory.shift()
    }
    return fps
  }

  getAverageFps() {
    if (this.fpsHistory.length === 0) return 60
    return Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length)
  }

  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      }
    }
    return null
  }

  getSceneStats() {
    let triangles = 0
    let objects = 0
    let geometries = 0
    let textures = 0

    this.sceneManager.scene.traverse((obj) => {
      objects++
      if (obj.geometry) {
        geometries++
        if (obj.geometry.index) {
          triangles += obj.geometry.index.count / 3
        } else if (obj.geometry.attributes.position) {
          triangles += obj.geometry.attributes.position.count / 3
        }
      }
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => {
          for (const key in m) {
            if (m[key] && m[key].isTexture) textures++
          }
        })
      }
    })

    return { triangles: Math.round(triangles), objects, geometries, textures }
  }

  autoAdjustLOD() {
    const avgFps = this.getAverageFps()
    if (avgFps < 25 && this.currentLod !== 'low') {
      this.currentLod = 'low'
      this._applyLOD('low')
    } else if (avgFps < 35 && this.currentLod !== 'medium') {
      this.currentLod = 'medium'
      this._applyLOD('medium')
    } else if (avgFps >= 45 && this.currentLod !== 'high') {
      this.currentLod = 'high'
      this._applyLOD('high')
    }
    return this.currentLod
  }

  _applyLOD(level) {
    const renderer = this.sceneManager.renderer
    switch (level) {
      case 'low':
        renderer.setPixelRatio(1)
        renderer.shadowMap.enabled = false
        break
      case 'medium':
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
        renderer.shadowMap.enabled = true
        break
      case 'high':
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        break
    }
  }

  getReport() {
    return {
      fps: this.getFps(),
      averageFps: this.getAverageFps(),
      lod: this.currentLod,
      memory: this.getMemoryUsage(),
      scene: this.getSceneStats()
    }
  }

  dispose() {
    this.fpsHistory = []
  }
}
