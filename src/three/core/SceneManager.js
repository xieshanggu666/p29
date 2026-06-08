import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export class SceneManager {
  constructor(container) {
    this.container = container
    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null
    this.clock = new THREE.Clock()
    this.animationCallbacks = []
    this.isRunning = false
    this._rafId = null

    this._init()
  }

  _init() {
    this._createScene()
    this._createCamera()
    this._createRenderer()
    this._createControls()
    this._createLights()
    this._createGround()
    this._setupResize()
  }

  _createScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87CEEB)
    this.scene.fog = new THREE.Fog(0x87CEEB, 150, 500)
  }

  _createCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000)
    this.camera.position.set(80, 60, 80)
    this.camera.lookAt(0, 0, 0)
  }

  _createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.container.appendChild(this.renderer.domElement)
  }

  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 10
    this.controls.maxDistance = 300
    this.controls.maxPolarAngle = Math.PI / 2.1
    this.controls.enablePan = true
    this.controls.panSpeed = 0.8
    this.controls.rotateSpeed = 0.6
    this.controls.zoomSpeed = 1.2
  }

  _createLights() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffeedd, 1.2)
    directionalLight.position.set(50, 80, 30)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 300
    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100
    this.scene.add(directionalLight)

    const fillLight = new THREE.DirectionalLight(0xaabbff, 0.3)
    fillLight.position.set(-30, 40, -30)
    this.scene.add(fillLight)

    const hemisphereLight = new THREE.HemisphereLight(0x88bbff, 0x443322, 0.4)
    this.scene.add(hemisphereLight)
  }

  _createGround() {
    const groundGeo = new THREE.BufferGeometry()
    const size = 200
    const segments = 80
    const vertices = []
    const indices = []
    const step = size / segments
    const half = size / 2

    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        vertices.push(-half + j * step, 0, -half + i * step)
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j
        const b = a + 1
        const c = a + (segments + 1)
        const d = c + 1
        indices.push(a, c, b)
        indices.push(b, c, d)
      }
    }

    groundGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    groundGeo.setIndex(indices)
    groundGeo.computeVertexNormals()

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x556b5a,
      roughness: 0.9,
      metalness: 0.1,
    })

    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.receiveShadow = true
    ground.name = 'ground'
    this.scene.add(ground)

    const gridHelper = new THREE.GridHelper(200, 40, 0x778877, 0x667766)
    gridHelper.position.y = 0.01
    this.scene.add(gridHelper)
  }

  _setupResize() {
    this._onResize = () => {
      if (!this.container) return
      const w = this.container.clientWidth
      const h = this.container.clientHeight
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h)
    }
    window.addEventListener('resize', this._onResize)
  }

  addUpdateCallback(callback) {
    this.animationCallbacks.push(callback)
  }

  removeUpdateCallback(callback) {
    const idx = this.animationCallbacks.indexOf(callback)
    if (idx !== -1) this.animationCallbacks.splice(idx, 1)
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.clock.start()
    this._animate()
  }

  stop() {
    this.isRunning = false
    if (this._rafId) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
  }

  _animate() {
    if (!this.isRunning) return
    this._rafId = requestAnimationFrame(() => this._animate())

    const delta = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()

    this.controls.update()

    for (let i = 0; i < this.animationCallbacks.length; i++) {
      this.animationCallbacks[i](delta, elapsed)
    }

    this.renderer.render(this.scene, this.camera)
  }

  getFps() {
    return Math.round(1 / this.clock.getDelta())
  }

  dispose() {
    this.stop()
    window.removeEventListener('resize', this._onResize)
    this.controls.dispose()
    this.renderer.dispose()
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement)
    }
  }
}
