import * as THREE from 'three'

export class WeatherManager {
  constructor(scene) {
    this.scene = scene
    this.currentWeather = 'sunny'
    this.particleSystems = {}
    this.particleData = {}
    this.animationTime = 0

    this.weatherConfig = {
      sunny: {
        background: 0x7EC8E3,
        ambientIntensity: 0.8,
        directionalIntensity: 1.8,
        fogDensity: 0.003,
        groundColor: 0x556b5a,
      },
      cloudy: {
        background: 0x8BA8B7,
        ambientIntensity: 0.6,
        directionalIntensity: 1.2,
        fogDensity: 0.005,
        groundColor: 0x5a6b5f,
      },
      overcast: {
        background: 0x5a6a7a,
        ambientIntensity: 0.45,
        directionalIntensity: 0.6,
        fogDensity: 0.008,
        groundColor: 0x4a5a5a,
      },
      rainy: {
        background: 0x3a4a5a,
        ambientIntensity: 0.35,
        directionalIntensity: 0.4,
        fogDensity: 0.012,
        groundColor: 0x3a4a4a,
      },
      snowy: {
        background: 0xB8C5D6,
        ambientIntensity: 0.5,
        directionalIntensity: 0.7,
        fogDensity: 0.015,
        groundColor: 0xD0D8E0,
      },
    }

    this.lights = {}
    this._createWeatherLights()
  }

  _createWeatherLights() {
    this.lights.ambient = this.scene.getObjectByName('weather-ambient') || new THREE.AmbientLight(0x404060, 0.8)
    this.lights.ambient.name = 'weather-ambient'
    if (!this.scene.getObjectByName('weather-ambient')) {
      this.scene.add(this.lights.ambient)
    }

    this.lights.directional = this.scene.getObjectByName('weather-directional')
    if (!this.lights.directional) {
      this.lights.directional = new THREE.DirectionalLight(0xffeedd, 1.8)
      this.lights.directional.position.set(50, 80, 30)
      this.lights.directional.name = 'weather-directional'
      this.scene.add(this.lights.directional)
    }

    this.lights.fill = this.scene.getObjectByName('weather-fill') || new THREE.DirectionalLight(0xaabbff, 0.4)
    this.lights.fill.position.set(-30, 40, -30)
    this.lights.fill.name = 'weather-fill'
    if (!this.scene.getObjectByName('weather-fill')) {
      this.scene.add(this.lights.fill)
    }
  }

  setWeather(weatherType) {
    if (this.currentWeather === weatherType) return

    this.currentWeather = weatherType
    this._clearParticleSystems()

    const config = this.weatherConfig[weatherType]
    if (!config) return

    this._updateEnvironment(config)

    switch (weatherType) {
      case 'rainy':
        this._createRainSystem()
        break
      case 'snowy':
        this._createSnowSystem()
        break
      case 'cloudy':
        this._createCloudSystem()
        break
      case 'overcast':
        this._createCloudSystem(true)
        break
    }
  }

  _updateEnvironment(config) {
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.setHex(config.background)
    }

    if (this.scene.fog) {
      this.scene.fog.density = config.fogDensity
      this.scene.fog.color.setHex(config.background)
    }

    if (this.lights.ambient) {
      this.lights.ambient.intensity = config.ambientIntensity
    }

    if (this.lights.directional) {
      this.lights.directional.intensity = config.directionalIntensity
      if (this.currentWeather === 'rainy' || this.currentWeather === 'overcast') {
        this.lights.directional.color.setHex(0x8899aa)
      } else if (this.currentWeather === 'snowy') {
        this.lights.directional.color.setHex(0xffffff)
      } else {
        this.lights.directional.color.setHex(0xffeedd)
      }
    }

    if (this.lights.fill) {
      this.lights.fill.intensity = this.currentWeather === 'sunny' ? 0.4 : 0.2
    }

    this.scene.traverse((obj) => {
      if (obj.name === 'ground' && obj.material) {
        obj.material.color.setHex(config.groundColor)
      }
    })
  }

  _createRainSystem() {
    const rainCount = 5000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(rainCount * 3)
    const velocities = new Float32Array(rainCount)

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300
      positions[i * 3 + 1] = Math.random() * 150
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300
      velocities[i] = 15 + Math.random() * 20
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0x8ab4d8,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const rain = new THREE.Points(geometry, material)
    rain.name = 'rain-particles'
    this.scene.add(rain)
    this.particleSystems.rain = rain
    this.particleData.rain = { velocities, count: rainCount }

    const splashCount = 200
    const splashGeometry = new THREE.BufferGeometry()
    const splashPositions = new Float32Array(splashCount * 3)
    const splashBasePositions = new Float32Array(splashCount * 3)
    const splashPhases = new Float32Array(splashCount)

    for (let i = 0; i < splashCount; i++) {
      const x = (Math.random() - 0.5) * 280
      const z = (Math.random() - 0.5) * 280
      splashPositions[i * 3] = x
      splashPositions[i * 3 + 1] = 0.01
      splashPositions[i * 3 + 2] = z
      splashBasePositions[i * 3] = x
      splashBasePositions[i * 3 + 1] = 0.01
      splashBasePositions[i * 3 + 2] = z
      splashPhases[i] = Math.random() * Math.PI * 2
    }

    splashGeometry.setAttribute('position', new THREE.Float32BufferAttribute(splashPositions, 3))

    const splashMaterial = new THREE.PointsMaterial({
      color: 0x5a8aba,
      size: 0.4,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const splash = new THREE.Points(splashGeometry, splashMaterial)
    splash.name = 'rain-splash'
    this.scene.add(splash)
    this.particleSystems.splash = splash
    this.particleData.splash = { basePositions: splashBasePositions, phases: splashPhases, count: splashCount }
  }

  _createSnowSystem() {
    const snowCount = 3000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(snowCount * 3)
    const velocities = new Float32Array(snowCount * 3)
    const phases = new Float32Array(snowCount)

    for (let i = 0; i < snowCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300
      positions[i * 3 + 1] = Math.random() * 150
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300
      velocities[i * 3] = (Math.random() - 0.5) * 2
      velocities[i * 3 + 1] = 1 + Math.random() * 2
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2
      phases[i] = Math.random() * Math.PI * 2
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const snow = new THREE.Points(geometry, material)
    snow.name = 'snow-particles'
    this.scene.add(snow)
    this.particleSystems.snow = snow
    this.particleData.snow = { velocities, phases, count: snowCount }
  }

  _createCloudSystem(overcast = false) {
    const cloudCount = overcast ? 12 : 6
    const clouds = []

    for (let i = 0; i < cloudCount; i++) {
      const cloudSize = 20 + Math.random() * 30
      const cloudGroup = new THREE.Group()
      cloudGroup.name = `cloud-${i}`

      const blobCount = 5 + Math.floor(Math.random() * 4)
      for (let j = 0; j < blobCount; j++) {
        const blobRadius = cloudSize * (0.3 + Math.random() * 0.4)
        const blobGeo = new THREE.SphereGeometry(blobRadius, 8, 6)
        const blobMat = new THREE.MeshStandardMaterial({
          color: overcast ? 0x5a6a7a : 0xd0d8e0,
          transparent: true,
          opacity: overcast ? 0.85 : 0.7,
          roughness: 1,
          metalness: 0,
        })
        const blob = new THREE.Mesh(blobGeo, blobMat)
        blob.position.set(
          (Math.random() - 0.5) * cloudSize * 0.8,
          (Math.random() - 0.3) * cloudSize * 0.2,
          (Math.random() - 0.5) * cloudSize * 0.6
        )
        blob.scale.y = 0.4 + Math.random() * 0.3
        cloudGroup.add(blob)
      }

      cloudGroup.position.set(
        (Math.random() - 0.5) * 400,
        75 + Math.random() * 40,
        (Math.random() - 0.5) * 400
      )
      cloudGroup.scale.setScalar(1 + Math.random() * 0.5)
      cloudGroup.userData.originalPosition = cloudGroup.position.clone()
      cloudGroup.userData.speed = 0.02 + Math.random() * 0.03

      clouds.push(cloudGroup)
      this.scene.add(cloudGroup)
    }

    this.particleSystems.clouds = clouds
  }

  _clearParticleSystems() {
    Object.values(this.particleSystems).forEach((system) => {
      if (Array.isArray(system)) {
        system.forEach((obj) => {
          obj.traverse((child) => {
            if (child.geometry) child.geometry.dispose()
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose())
              } else {
                child.material.dispose()
              }
            }
          })
          this.scene.remove(obj)
        })
      } else if (system) {
        if (system.geometry) system.geometry.dispose()
        if (system.material) {
          if (Array.isArray(system.material)) {
            system.material.forEach(m => m.dispose())
          } else {
            system.material.dispose()
          }
        }
        this.scene.remove(system)
      }
    })
    this.particleSystems = {}
    this.particleData = {}
  }

  update(delta, elapsed) {
    this.animationTime += delta

    if (this.particleSystems.rain && this.particleData.rain) {
      this._updateRain(delta, elapsed)
    }

    if (this.particleSystems.splash && this.particleData.splash) {
      this._updateSplash(delta, elapsed)
    }

    if (this.particleSystems.snow && this.particleData.snow) {
      this._updateSnow(delta, elapsed)
    }

    if (this.particleSystems.clouds) {
      this._updateClouds(delta)
    }
  }

  _updateRain(delta, elapsed) {
    const rain = this.particleSystems.rain
    const data = this.particleData.rain
    const positions = rain.geometry.attributes.position.array
    const windX = Math.sin(elapsed * 0.3) * 2

    for (let i = 0; i < data.count; i++) {
      positions[i * 3] += windX * delta
      positions[i * 3 + 1] -= data.velocities[i] * delta
      positions[i * 3 + 2] += (Math.random() - 0.5) * delta

      if (positions[i * 3 + 1] < 0.1) {
        positions[i * 3] = (Math.random() - 0.5) * 300
        positions[i * 3 + 1] = 140 + Math.random() * 10
        positions[i * 3 + 2] = (Math.random() - 0.5) * 300
      }
    }

    rain.geometry.attributes.position.needsUpdate = true
  }

  _updateSplash(delta, elapsed) {
    const splash = this.particleSystems.splash
    const data = this.particleData.splash
    const positions = splash.geometry.attributes.position.array

    for (let i = 0; i < data.count; i++) {
      const t = (elapsed * 2 + data.phases[i]) % 1
      const scale = 1 - t
      positions[i * 3] = data.basePositions[i * 3] + Math.sin(t * Math.PI * 2) * 0.5 * scale
      positions[i * 3 + 1] = data.basePositions[i * 3 + 1] + Math.sin(t * Math.PI) * 0.3 * scale
      positions[i * 3 + 2] = data.basePositions[i * 3 + 2] + Math.cos(t * Math.PI * 2) * 0.5 * scale
    }

    splash.geometry.attributes.position.needsUpdate = true
    splash.material.opacity = 0.3 + Math.sin(elapsed * 4) * 0.1
  }

  _updateSnow(delta, elapsed) {
    const snow = this.particleSystems.snow
    const data = this.particleData.snow
    const positions = snow.geometry.attributes.position.array

    for (let i = 0; i < data.count; i++) {
      const phase = data.phases[i]
      positions[i * 3] += (Math.sin(elapsed * 0.5 + phase) * 0.5 + data.velocities[i * 3] * delta * 0.3)
      positions[i * 3 + 1] -= data.velocities[i * 3 + 1] * delta
      positions[i * 3 + 2] += (Math.cos(elapsed * 0.4 + phase) * 0.3 + data.velocities[i * 3 + 2] * delta * 0.3)

      if (positions[i * 3 + 1] < 0.1) {
        positions[i * 3] = (Math.random() - 0.5) * 300
        positions[i * 3 + 1] = 140 + Math.random() * 10
        positions[i * 3 + 2] = (Math.random() - 0.5) * 300
      }
    }

    snow.geometry.attributes.position.needsUpdate = true
  }

  _updateClouds(delta) {
    this.particleSystems.clouds.forEach((cloud) => {
      cloud.position.x += cloud.userData.speed
      if (cloud.position.x > 220) {
        cloud.position.x = -220
        cloud.position.z = cloud.userData.originalPosition.z + (Math.random() - 0.5) * 100
      }
    })
  }

  dispose() {
    this._clearParticleSystems()
  }
}
