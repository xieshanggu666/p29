import * as THREE from 'three'

export class ViewpointManager {
  constructor(sceneManager) {
    this.sceneManager = sceneManager
    this.savedViewpoints = new Map()
    this._loadFromStorage()
  }

  save(name) {
    const camera = this.sceneManager.camera
    const viewpoint = {
      position: camera.position.toArray(),
      target: this.sceneManager.controls.target.toArray(),
      zoom: camera.zoom,
      timestamp: Date.now()
    }
    this.savedViewpoints.set(name, viewpoint)
    this._saveToStorage()
    return viewpoint
  }

  restore(name) {
    const vp = this.savedViewpoints.get(name)
    if (!vp) return false

    const camera = this.sceneManager.camera
    const controls = this.sceneManager.controls

    const startPos = camera.position.clone()
    const endPos = new THREE.Vector3().fromArray(vp.position)
    const startTarget = controls.target.clone()
    const endTarget = new THREE.Vector3().fromArray(vp.target)

    const duration = 800
    const startTime = performance.now()

    const animate = () => {
      const now = performance.now()
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)

      camera.position.lerpVectors(startPos, endPos, eased)
      controls.target.lerpVectors(startTarget, endTarget, eased)
      controls.update()

      if (t < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
    camera.zoom = vp.zoom
    camera.updateProjectionMatrix()
    return true
  }

  delete(name) {
    const deleted = this.savedViewpoints.delete(name)
    if (deleted) this._saveToStorage()
    return deleted
  }

  getAll() {
    const result = []
    this.savedViewpoints.forEach((value, key) => {
      result.push({ name: key, ...value })
    })
    return result
  }

  _saveToStorage() {
    try {
      const data = {}
      this.savedViewpoints.forEach((value, key) => { data[key] = value })
      localStorage.setItem('district3d_viewpoints', JSON.stringify(data))
    } catch (e) { /* ignore */ }
  }

  _loadFromStorage() {
    try {
      const raw = localStorage.getItem('district3d_viewpoints')
      if (raw) {
        const data = JSON.parse(raw)
        for (const key in data) {
          this.savedViewpoints.set(key, data[key])
        }
      }
    } catch (e) { /* ignore */ }
  }

  dispose() {
    this.savedViewpoints.clear()
  }
}
