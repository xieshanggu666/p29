import { describe, it, expect } from 'vitest'
import { districtConfig, scenePresets, annotationData } from '../src/config/districtData.js'

describe('districtConfig', () => {
  it('should have buildings array', () => {
    expect(Array.isArray(districtConfig.buildings)).toBe(true)
    expect(districtConfig.buildings.length).toBeGreaterThan(0)
  })

  it('each building should have required fields', () => {
    for (const b of districtConfig.buildings) {
      expect(b.id).toBeDefined()
      expect(b.name).toBeDefined()
      expect(b.type).toBeDefined()
      expect(b.position).toBeDefined()
      expect(b.size).toBeDefined()
      expect(b.floors).toBeGreaterThan(0)
      expect(b.info).toBeDefined()
    }
  })

  it('building types should be valid', () => {
    const validTypes = ['commercial', 'office', 'residential', 'retail']
    for (const b of districtConfig.buildings) {
      expect(validTypes).toContain(b.type)
    }
  })

  it('should have roads array', () => {
    expect(Array.isArray(districtConfig.roads)).toBe(true)
    expect(districtConfig.roads.length).toBeGreaterThan(0)
  })

  it('each road should have required fields', () => {
    for (const r of districtConfig.roads) {
      expect(r.id).toBeDefined()
      expect(r.name).toBeDefined()
      expect(r.path).toBeDefined()
      expect(r.path.length).toBeGreaterThan(1)
    }
  })

  it('should have greenery array', () => {
    expect(Array.isArray(districtConfig.greenery)).toBe(true)
    expect(districtConfig.greenery.length).toBeGreaterThan(0)
  })

  it('greenery categories should be valid', () => {
    const validCats = ['tree', 'park', 'lawn']
    for (const g of districtConfig.greenery) {
      expect(validCats).toContain(g.category)
    }
  })
})

describe('scenePresets', () => {
  it('should have overview preset', () => {
    expect(scenePresets.overview).toBeDefined()
    expect(scenePresets.overview.name).toBeDefined()
    expect(scenePresets.overview.position).toBeDefined()
    expect(scenePresets.overview.target).toBeDefined()
  })

  it('all presets should have position and target arrays', () => {
    for (const key in scenePresets) {
      expect(scenePresets[key].position).toHaveLength(3)
      expect(scenePresets[key].target).toHaveLength(3)
    }
  })
})

describe('annotationData', () => {
  it('should be non-empty array', () => {
    expect(Array.isArray(annotationData)).toBe(true)
    expect(annotationData.length).toBeGreaterThan(0)
  })

  it('each annotation should have required fields', () => {
    for (const a of annotationData) {
      expect(a.id).toBeDefined()
      expect(a.targetId).toBeDefined()
      expect(a.position).toBeDefined()
      expect(a.title).toBeDefined()
      expect(a.content).toBeDefined()
    }
  })
})
