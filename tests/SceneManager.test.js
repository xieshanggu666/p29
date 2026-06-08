import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockTarget = { x: 0, y: 0, z: 0 }

vi.mock('three', async () => {
  const actual = await vi.importActual('three')
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: document.createElement('canvas'),
      shadowMap: { enabled: true, type: null },
      toneMapping: null,
      toneMappingExposure: 1,
    })),
  }
})

vi.mock('three/addons/controls/OrbitControls.js', () => {
  const { Vector3 } = require('three')
  return {
    OrbitControls: vi.fn().mockImplementation(() => ({
      enableDamping: false,
      dampingFactor: 0,
      minDistance: 0,
      maxDistance: 0,
      maxPolarAngle: 0,
      enablePan: false,
      panSpeed: 0,
      rotateSpeed: 0,
      zoomSpeed: 0,
      update: vi.fn(),
      dispose: vi.fn(),
      target: new Vector3(),
    })),
  }
})

import { SceneManager } from '../src/three/core/SceneManager.js'

describe('SceneManager', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    container.style.width = '800px'
    container.style.height = '600px'
    document.body.appendChild(container)
  })

  it('should create scene with correct properties', () => {
    const sm = new SceneManager(container)
    expect(sm.scene).toBeDefined()
    expect(sm.camera).toBeDefined()
    expect(sm.renderer).toBeDefined()
    expect(sm.controls).toBeDefined()
    sm.dispose()
  })

  it('should have correct camera defaults', () => {
    const sm = new SceneManager(container)
    expect(sm.camera.fov).toBe(60)
    expect(sm.camera.near).toBe(0.1)
    expect(sm.camera.far).toBe(2000)
    sm.dispose()
  })

  it('should add and remove update callbacks', () => {
    const sm = new SceneManager(container)
    const cb = vi.fn()
    sm.addUpdateCallback(cb)
    expect(sm.animationCallbacks).toContain(cb)
    sm.removeUpdateCallback(cb)
    expect(sm.animationCallbacks).not.toContain(cb)
    sm.dispose()
  })

  it('should start and stop animation loop', () => {
    const sm = new SceneManager(container)
    sm.start()
    expect(sm.isRunning).toBe(true)
    sm.stop()
    expect(sm.isRunning).toBe(false)
    sm.dispose()
  })

  it('should dispose all resources', () => {
    const sm = new SceneManager(container)
    sm.dispose()
    expect(sm.isRunning).toBe(false)
  })
})
