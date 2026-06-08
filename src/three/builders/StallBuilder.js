import * as THREE from 'three'

export class StallBuilder {
  constructor(scene) {
    this.scene = scene
    this.stallGroup = new THREE.Group()
    this.stallGroup.name = 'stalls'
    this.scene.add(this.stallGroup)
    this.materials = this._createMaterials()
  }

  _createMaterials() {
    return {
      canopy1: new THREE.MeshStandardMaterial({
        color: 0xe63946,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }),
      canopy2: new THREE.MeshStandardMaterial({
        color: 0xf4a261,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }),
      canopy3: new THREE.MeshStandardMaterial({
        color: 0x2a9d8f,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }),
      canopy4: new THREE.MeshStandardMaterial({
        color: 0x457b9d,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }),
      frame: new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.7,
        metalness: 0.3,
      }),
      counter: new THREE.MeshStandardMaterial({
        color: 0xd4a373,
        roughness: 0.8,
        metalness: 0.05,
      }),
      goods1: new THREE.MeshStandardMaterial({
        color: 0xffb4a2,
        roughness: 0.5,
        metalness: 0.1,
      }),
      goods2: new THREE.MeshStandardMaterial({
        color: 0xb5e48c,
        roughness: 0.5,
        metalness: 0.1,
      }),
      goods3: new THREE.MeshStandardMaterial({
        color: 0xf9c74f,
        roughness: 0.5,
        metalness: 0.1,
      }),
      sign: new THREE.MeshStandardMaterial({
        color: 0xffd166,
        roughness: 0.4,
        metalness: 0.2,
        emissive: 0x553300,
        emissiveIntensity: 0.3,
      }),
    }
  }

  buildFromConfig(config) {
    for (const item of config) {
      this.createStall(item)
    }
  }

  createStall({ id, position, rotation = 0, type = 'food', scale = 1 }) {
    const group = new THREE.Group()
    group.name = `stall_${id}`
    group.userData = {
      interactive: true,
      stallId: id,
      stallType: type,
      category: 'stall',
    }

    const canopyMaterials = [this.materials.canopy1, this.materials.canopy2, this.materials.canopy3, this.materials.canopy4]
    const canopyMat = canopyMaterials[Math.floor(Math.random() * canopyMaterials.length)]

    this._addFrame(group)
    this._addCanopy(group, canopyMat)
    this._addCounter(group)

    if (type === 'food') {
      this._addFoodItems(group)
    } else if (type === 'retail') {
      this._addRetailItems(group)
    } else if (type === 'snack') {
      this._addSnackCart(group)
    }

    this._addSign(group)

    group.position.set(position[0], 0, position[1])
    group.rotation.y = rotation
    group.scale.set(scale, scale, scale)
    this.stallGroup.add(group)
    return group
  }

  _addFrame(group) {
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6)
    const poleMat = this.materials.frame

    const positions = [
      [-1.2, 0, -0.8],
      [1.2, 0, -0.8],
      [-1.2, 0, 0.8],
      [1.2, 0, 0.8],
    ]

    for (const pos of positions) {
      const pole = new THREE.Mesh(poleGeo, poleMat)
      pole.position.set(pos[0], 1.25, pos[2])
      pole.castShadow = true
      group.add(pole)
    }
  }

  _addCanopy(group, canopyMat) {
    const canopyGeo = new THREE.BufferGeometry()
    const hw = 1.5
    const hd = 1.1
    const peak = 0.4

    const positions = new Float32Array([
      -hw, 2.5, -hd,
       hw, 2.5, -hd,
       hw, 2.5,  hd,
      -hw, 2.5,  hd,
       0, 2.5 + peak, 0,
    ])
    const indices = [
      0, 1, 4,
      1, 2, 4,
      2, 3, 4,
      3, 0, 4,
    ]

    canopyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    canopyGeo.setIndex(indices)
    canopyGeo.computeVertexNormals()

    const canopy = new THREE.Mesh(canopyGeo, canopyMat)
    canopy.castShadow = true
    canopy.receiveShadow = true
    group.add(canopy)
  }

  _addCounter(group) {
    const counterGeo = new THREE.BoxGeometry(2.2, 0.9, 0.8)
    const counter = new THREE.Mesh(counterGeo, this.materials.counter)
    counter.position.set(0, 0.45, -0.3)
    counter.castShadow = true
    counter.receiveShadow = true
    group.add(counter)

    const topGeo = new THREE.BoxGeometry(2.4, 0.05, 1.0)
    const top = new THREE.Mesh(topGeo, this.materials.frame)
    top.position.set(0, 0.9, -0.3)
    group.add(top)
  }

  _addFoodItems(group) {
    const goodsMats = [this.materials.goods1, this.materials.goods2, this.materials.goods3]
    for (let i = 0; i < 5; i++) {
      const size = 0.15 + Math.random() * 0.1
      const geo = new THREE.SphereGeometry(size, 6, 4)
      const mat = goodsMats[Math.floor(Math.random() * goodsMats.length)]
      const item = new THREE.Mesh(geo, mat)
      item.position.set(-0.8 + i * 0.4, 1.0 + size, -0.3)
      item.castShadow = true
      group.add(item)
    }

    const potGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.3, 8)
    const potMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.8 })
    const pot = new THREE.Mesh(potGeo, potMat)
    pot.position.set(0.6, 1.05, -0.5)
    pot.castShadow = true
    group.add(pot)

    const steamGeo = new THREE.SphereGeometry(0.08, 4, 4)
    const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
    for (let i = 0; i < 3; i++) {
      const steam = new THREE.Mesh(steamGeo, steamMat)
      steam.position.set(0.6 + (i - 1) * 0.1, 1.3 + i * 0.1, -0.5)
      group.add(steam)
    }
  }

  _addRetailItems(group) {
    const shelfGeo = new THREE.BoxGeometry(0.4, 0.5, 0.3)
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.7 })
    for (let i = 0; i < 3; i++) {
      const shelf = new THREE.Mesh(shelfGeo, shelfMat)
      shelf.position.set(-0.6 + i * 0.6, 1.15, -0.3)
      shelf.castShadow = true
      group.add(shelf)
    }

    const goodsMats = [this.materials.goods1, this.materials.goods2, this.materials.goods3]
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.BoxGeometry(0.2, 0.25, 0.2)
      const mat = goodsMats[Math.floor(Math.random() * goodsMats.length)]
      const item = new THREE.Mesh(geo, mat)
      item.position.set(-0.6 + i * 0.4, 1.45, -0.3)
      item.castShadow = true
      group.add(item)
    }
  }

  _addSnackCart(group) {
    const cartGeo = new THREE.BoxGeometry(1.5, 0.1, 0.9)
    const cartMat = new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.6 })
    const cart = new THREE.Mesh(cartGeo, cartMat)
    cart.position.set(0, 0.8, 0)
    cart.castShadow = true
    group.add(cart)

    const wheelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 8)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.5 })
    const wheelPositions = [
      [-0.6, 0.15, 0.45],
      [0.6, 0.15, 0.45],
      [-0.6, 0.15, -0.45],
      [0.6, 0.15, -0.45],
    ]
    for (const pos of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.position.set(pos[0], pos[1], pos[2])
      wheel.rotation.x = Math.PI / 2
      group.add(wheel)
    }

    const grillGeo = new THREE.BoxGeometry(0.8, 0.05, 0.5)
    const grillMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.9 })
    const grill = new THREE.Mesh(grillGeo, grillMat)
    grill.position.set(0, 0.85, -0.1)
    group.add(grill)

    const foodGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 6)
    const foodMat = new THREE.MeshStandardMaterial({ color: 0xd2691e, roughness: 0.6 })
    for (let i = 0; i < 3; i++) {
      const food = new THREE.Mesh(foodGeo, foodMat)
      food.position.set(-0.2 + i * 0.2, 0.95, -0.1)
      group.add(food)
    }
  }

  _addSign(group) {
    const signGeo = new THREE.BoxGeometry(0.8, 0.3, 0.05)
    const sign = new THREE.Mesh(signGeo, this.materials.sign)
    sign.position.set(0, 2.2, -0.85)
    sign.castShadow = true
    group.add(sign)

    const hookGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4)
    const hookMat = this.materials.frame
    const hook = new THREE.Mesh(hookGeo, hookMat)
    hook.position.set(0, 2.35, -0.85)
    group.add(hook)
  }

  updateAnimation(elapsed) {
    this.stallGroup.children.forEach((stall, i) => {
      stall.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'SphereGeometry') {
          if (child.material && child.material.opacity < 1) {
            child.position.y += Math.sin(elapsed * 2 + i) * 0.001
          }
        }
      })
    })
  }

  dispose() {
    this.stallGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
        else child.material.dispose()
      }
    })
    this.scene.remove(this.stallGroup)
  }
}
