import { describe, it, expect, beforeEach } from 'vitest'
import { useViewpointStore } from '../src/store/viewpointStore.js'
import { createPinia, setActivePinia } from 'pinia'

describe('viewpointStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize empty', () => {
    const store = useViewpointStore()
    expect(store.viewpoints).toHaveLength(0)
  })

  it('should add viewpoint', () => {
    const store = useViewpointStore()
    store.addViewpoint({ name: 'test', timestamp: Date.now() })
    expect(store.viewpoints).toHaveLength(1)
  })

  it('should remove viewpoint', () => {
    const store = useViewpointStore()
    store.addViewpoint({ name: 'test1', timestamp: Date.now() })
    store.addViewpoint({ name: 'test2', timestamp: Date.now() })
    store.removeViewpoint('test1')
    expect(store.viewpoints).toHaveLength(1)
    expect(store.viewpoints[0].name).toBe('test2')
  })

  it('viewpointList should have formatted time', () => {
    const store = useViewpointStore()
    store.addViewpoint({ name: 'test', timestamp: Date.now() })
    expect(store.viewpointList[0].formattedTime).toBeDefined()
  })
})
