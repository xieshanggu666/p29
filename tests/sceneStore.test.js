import { describe, it, expect, beforeEach } from 'vitest'
import { useSceneStore } from '../src/store/sceneStore.js'
import { createPinia, setActivePinia } from 'pinia'

describe('sceneStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default values', () => {
    const store = useSceneStore()
    expect(store.isLoaded).toBe(false)
    expect(store.isLoading).toBe(false)
    expect(store.fps).toBe(60)
    expect(store.lodLevel).toBe('high')
  })

  it('should set loaded state', () => {
    const store = useSceneStore()
    store.setLoaded(true)
    expect(store.isLoaded).toBe(true)
  })

  it('should toggle annotations', () => {
    const store = useSceneStore()
    const initial = store.showAnnotations
    store.toggleAnnotations()
    expect(store.showAnnotations).toBe(!initial)
  })

  it('should toggle wireframe', () => {
    const store = useSceneStore()
    const initial = store.wireframeMode
    store.toggleWireframe()
    expect(store.wireframeMode).toBe(!initial)
  })

  it('should handle selection', () => {
    const store = useSceneStore()
    expect(store.hasSelection).toBe(false)
    store.setSelectedObject({ id: 'b001', name: 'Test' })
    expect(store.hasSelection).toBe(true)
    store.clearSelection()
    expect(store.hasSelection).toBe(false)
  })

  it('should set fps', () => {
    const store = useSceneStore()
    store.setFps(45)
    expect(store.fps).toBe(45)
  })
})
