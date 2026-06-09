import * as THREE from 'three'

export class WeatherManager {
  constructor(scene) {
    this.scene = scene
    this.currentWeather = 'sunny'
    this.particleSystems = {}
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
      this.scene.background = new THREE.Color(config.background)
    }
    
    if (this.scene.fog) {
      this.scene.fog.density = config.fogDensity
      this.scene.fog.color = new THREE.Color(config.background)
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
    const rainGeometry = new THREE.BufferGeometry()
    const rainPositions = new Float32Array(rainCount * 3)
    const rainVelocities = new Float32Array(rainCount * 3)
    
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 300
      rainPositions[i * 3 + 1] = Math.random() * 150
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 300
      
      rainVelocities[i * 3] = (Math.random() - 0.5) * 0.5
      rainVelocities[i * 3 + 1] = -15 - Math.random() * 20
      rainVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }
    
    rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rainPositions, 3))
    rainGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(rainVelocities, 3))
    
    const rainMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x4a5a6a) },
        size: { value: 0.15 },
      },
      vertexShader: `
        attribute vec3 velocity;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          vec3 pos = position + velocity * time * 0.1;
          if (pos.y < 0.1) {
            pos.y = 150.0;
          }
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - dist * 2.0;
          gl_FragColor = vec4(vColor, alpha * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    
    const rainSystem = new THREE.Points(rainGeometry, rainMaterial)
    rainSystem.name = 'rain-particles'
    this.scene.add(rainSystem)
    this.particleSystems.rain = rainSystem
    
    const splashGeometry = new THREE.BufferGeometry()
    const splashPositions = new Float32Array(200 * 3)
    const splashTimes = new Float32Array(200)
    
    for (let i = 0; i < 200; i++) {
      splashPositions[i * 3] = (Math.random() - 0.5) * 280
      splashPositions[i * 3 + 1] = 0.01
      splashPositions[i * 3 + 2] = (Math.random() - 0.5) * 280
      splashTimes[i] = Math.random() * 2
    }
    
    splashGeometry.setAttribute('position', new THREE.Float32BufferAttribute(splashPositions, 3))
    splashGeometry.setAttribute('timeOffset', new THREE.Float32BufferAttribute(splashTimes, 1))
    
    const splashMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x5a7a9a) },
        size: { value: 0.3 },
        time: { value: 0 },
      },
      vertexShader: `
        attribute float timeOffset;
        varying float vAlpha;
        uniform float time;
        uniform float size;
        
        void main() {
          float t = mod(time + timeOffset, 1.0);
          float scale = 1.0 - t;
          vAlpha = scale * 0.5;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * scale * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        uniform vec3 color;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    
    const splashSystem = new THREE.Points(splashGeometry, splashMaterial)
    splashSystem.name = 'rain-splash'
    this.scene.add(splashSystem)
    this.particleSystems.splash = splashSystem
  }
  
  _createSnowSystem() {
    const snowCount = 3000
    const snowGeometry = new THREE.BufferGeometry()
    const snowPositions = new Float32Array(snowCount * 3)
    const snowVelocities = new Float32Array(snowCount * 3)
    const snowSizes = new Float32Array(snowCount)
    const snowPhases = new Float32Array(snowCount)
    
    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3] = (Math.random() - 0.5) * 350
      snowPositions[i * 3 + 1] = Math.random() * 200
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 350
      
      snowVelocities[i * 3] = (Math.random() - 0.5) * 2
      snowVelocities[i * 3 + 1] = -2 - Math.random() * 3
      snowVelocities[i * 3 + 2] = (Math.random() - 0.5) * 2
      
      snowSizes[i] = 0.8 + Math.random() * 1.2
      snowPhases[i] = Math.random() * Math.PI * 2
    }
    
    snowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(snowPositions, 3))
    snowGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(snowVelocities, 3))
    snowGeometry.setAttribute('size', new THREE.Float32BufferAttribute(snowSizes, 1))
    snowGeometry.setAttribute('phase', new THREE.Float32BufferAttribute(snowPhases, 1))
    
    const snowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        time: { value: 0 },
      },
      vertexShader: `
        attribute vec3 velocity;
        attribute float size;
        attribute float phase;
        varying float vAlpha;
        uniform float time;
        
        void main() {
          float wobble = sin(time * 2.0 + phase) * 0.5;
          vec3 pos = position + velocity * time * 0.05;
          pos.x += wobble;
          pos.z += cos(time * 1.5 + phase) * 0.3;
          
          if (pos.y < 0.1) {
            pos.y = 200.0;
            pos.x = (random(position.xy) - 0.5) * 350;
            pos.z = (random(position.yz) - 0.5) * 350;
          }
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          vAlpha = 0.8 + sin(time + phase) * 0.2;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        uniform vec3 color;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = (1.0 - dist * 2.0) * vAlpha * 0.9;
          float glow = exp(-dist * 4.0) * 0.3;
          gl_FragColor = vec4(color + glow, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    
    const snowSystem = new THREE.Points(snowGeometry, snowMaterial)
    snowSystem.name = 'snow-particles'
    this.scene.add(snowSystem)
    this.particleSystems.snow = snowSystem
  }
  
  _createCloudSystem(overcast = false) {
    const cloudCount = overcast ? 12 : 6
    const clouds = []
    
    for (let i = 0; i < cloudCount; i++) {
      const cloudGeometry = new THREE.BufferGeometry()
      const positions = []
      const cloudSize = 20 + Math.random() * 30
      
      for (let j = 0; j < 50; j++) {
        const offsetX = (Math.random() - 0.5) * cloudSize
        const offsetY = Math.random() * cloudSize * 0.3
        const offsetZ = (Math.random() - 0.5) * cloudSize
        positions.push(offsetX, offsetY, offsetZ)
      }
      
      cloudGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      
      const cloudMaterial = new THREE.MeshBasicMaterial({
        color: overcast ? 0x4a5a6a : 0xc0c8d0,
        transparent: true,
        opacity: overcast ? 0.9 : 0.7,
      })
      
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial)
      cloud.position.set(
        (Math.random() - 0.5) * 400,
        80 + Math.random() * 40,
        (Math.random() - 0.5) * 400
      )
      cloud.scale.setScalar(1.5 + Math.random())
      cloud.userData.originalPosition = cloud.position.clone()
      cloud.userData.speed = 0.02 + Math.random() * 0.03
      cloud.name = `cloud-${i}`
      
      clouds.push(cloud)
      this.scene.add(cloud)
    }
    
    this.particleSystems.clouds = clouds
  }
  
  _clearParticleSystems() {
    Object.values(this.particleSystems).forEach((system) => {
      if (Array.isArray(system)) {
        system.forEach((obj) => {
          if (obj.geometry) obj.geometry.dispose()
          if (obj.material) obj.material.dispose()
          this.scene.remove(obj)
        })
      } else {
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
  }
  
  update(delta, elapsed) {
    this.animationTime += delta
    
    if (this.particleSystems.rain && this.particleSystems.rain.material.uniforms) {
      this.particleSystems.rain.material.uniforms.time.value = elapsed
    }
    
    if (this.particleSystems.splash && this.particleSystems.splash.material.uniforms) {
      this.particleSystems.splash.material.uniforms.time.value = elapsed
    }
    
    if (this.particleSystems.snow && this.particleSystems.snow.material.uniforms) {
      this.particleSystems.snow.material.uniforms.time.value = elapsed
    }
    
    if (this.particleSystems.clouds) {
      this.particleSystems.clouds.forEach((cloud) => {
        cloud.position.x += cloud.userData.speed
        cloud.rotation.y += delta * 0.1
        
        if (cloud.position.x > 220) {
          cloud.position.x = -220
          cloud.position.z = cloud.userData.originalPosition.z + (Math.random() - 0.5) * 100
        }
      })
    }
  }
  
  dispose() {
    this._clearParticleSystems()
  }
}