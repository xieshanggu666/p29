import { useSceneStore } from '../store/sceneStore.js'

export function useScenePerformance(performanceManager, modelBuilder) {
  const sceneStore = useSceneStore()
  let perfTimer = null

  function startPerfMonitor() {
    perfTimer = setInterval(() => {
      if (!performanceManager.value) return
      const report = performanceManager.value.getReport()
      sceneStore.setFps(report.fps)
      sceneStore.setLodLevel(report.lod)
      sceneStore.setPerformanceStats(report)

      if (report.averageFps < 30) {
        performanceManager.value.autoAdjustLOD()
      }
    }, 1000)
  }

  function stopPerfMonitor() {
    if (perfTimer) {
      clearInterval(perfTimer)
      perfTimer = null
    }
  }

  function runPerformanceBenchmark() {
    return new Promise((resolve) => {
      const before = performanceManager.value.getReport()
      const beforePedStats = modelBuilder.value?.getVehicleBuilder?.()?.getPedestrianStats?.() || {}

      setTimeout(() => {
        const after = performanceManager.value.getReport()
        const afterPedStats = modelBuilder.value?.getVehicleBuilder?.()?.getPedestrianStats?.() || {}

        const comparison = {
          timestamp: new Date().toISOString(),
          before: {
            fps: before.fps,
            avgFps: before.averageFps,
            drawCalls: before.drawCalls,
            triangles: before.triangles,
            memory: before.memory,
            visiblePedestrians: beforePedStats.visibleCount || 0,
          },
          after: {
            fps: after.fps,
            avgFps: after.averageFps,
            drawCalls: after.drawCalls,
            triangles: after.triangles,
            memory: after.memory,
            visiblePedestrians: afterPedStats.visibleCount || 0,
            highDetailCount: afterPedStats.highDetailCount || 0,
            mediumDetailCount: afterPedStats.mediumDetailCount || 0,
            lowDetailCount: afterPedStats.lowDetailCount || 0,
            culledCount: afterPedStats.culledCount || 0,
            polygonReductionPercent: afterPedStats.polygonReductionPercent || 0,
          },
          improvements: {
            fpsImprovement: (after.averageFps - before.averageFps).toFixed(1),
            fpsPercentChange: (((after.averageFps - before.averageFps) / Math.max(before.averageFps, 1)) * 100).toFixed(1),
          },
        }

        console.log('=== 性能测试报告 ===')
        console.log('优化前 FPS:', before.averageFps)
        console.log('优化后 FPS:', after.averageFps)
        console.log('FPS 提升:', comparison.improvements.fpsImprovement)
        console.log('FPS 提升百分比:', comparison.improvements.fpsPercentChange + '%')
        console.log('高细节行人:', afterPedStats.highDetailCount || 0)
        console.log('中细节行人:', afterPedStats.mediumDetailCount || 0)
        console.log('低细节行人:', afterPedStats.lowDetailCount || 0)
        console.log('视口剔除数量:', afterPedStats.culledCount || 0)
        console.log('多边形优化率:', (afterPedStats.polygonReductionPercent || 0) + '%')
        console.log('==================')

        resolve(comparison)
      }, 5000)
    })
  }

  function getDeviceCompatibilityInfo() {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    const rendererInfo = gl ? {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxAnisotropy: gl.getExtension('EXT_texture_filter_anisotropic')
        ? gl.getParameter(gl.getExtension('EXT_texture_filter_anisotropic').MAX_TEXTURE_MAX_ANISOTROPY_EXT)
        : 1,
    } : null

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
      deviceMemory: navigator.deviceMemory || 'Unknown',
      pixelRatio: window.devicePixelRatio,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      webgl: gl ? (gl instanceof WebGL2RenderingContext ? 'WebGL 2.0' : 'WebGL 1.0') : 'Not Supported',
      rendererInfo,
      lowEndDevice: !gl || (navigator.hardwareConcurrency || 8) < 4 || (navigator.deviceMemory || 8) < 4,
    }
  }

  return {
    startPerfMonitor,
    stopPerfMonitor,
    runPerformanceBenchmark,
    getDeviceCompatibilityInfo,
  }
}
