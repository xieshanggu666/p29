import * as THREE from 'three'

export class GreeneryBuilder {
  constructor(scene) {
    this.scene = scene
    this.greeneryGroup = new THREE.Group()
    this.greeneryGroup.name = 'greenery'
    this.scene.add(this.greeneryGroup)
    this._treeGeometries = this._createTreeGeometries()
  }

  buildFromConfig(config) {
    for (const item of config) {
      if (item.category === 'tree') {
        this.createTree(item)
      } else if (item.category === 'park') {
        this.createPark(item)
      } else if (item.category === 'lawn') {
        this.createLawn(item)
      }
    }
  }

  createTree({ id, position, scale = 1, type = 'deciduous' }) {
    const group = new THREE.Group()
    group.name = `tree_${id}`
    group.position.set(position[0], 0, position[1])
    group.scale.set(scale, scale, scale)
    group.userData = { interactive: true, greeneryId: id, category: 'tree', treeType: type }

    const treeGeo = type === 'deciduous'
      ? this._treeGeometries.deciduous
      : this._treeGeometries.coniferous

    const tree = treeGeo.clone()
    tree.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.userData = { interactive: true, greeneryId: id, category: 'tree', treeType: type }
      }
    })
    group.add(tree)
    this.greeneryGroup.add(group)
    return group
  }

  createPark({ id, position, size }) {
    const geo = new THREE.BufferGeometry()
    const hw = size[0] / 2
    const hd = size[1] / 2
    const positions = new Float32Array([
      -hw, 0.03, -hd,
       hw, 0.03, -hd,
       hw, 0.03,  hd,
      -hw, 0.03,  hd,
    ])
    const indices = [0, 1, 2, 0, 2, 3]
    const normals = new Float32Array([0,1,0, 0,1,0, 0,1,0, 0,1,0])
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    geo.setIndex(indices)

    const mat = new THREE.MeshStandardMaterial({
      color: 0x2d5a27,
      roughness: 0.9,
      metalness: 0.0,
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(position[0], 0, position[1])
    mesh.receiveShadow = true
    mesh.name = `park_${id}`
    mesh.userData = { interactive: true, greeneryId: id, category: 'park' }
    this.greeneryGroup.add(mesh)
    return mesh
  }

  createLawn({ id, center, radius }) {
    const geo = new THREE.BufferGeometry()
    const segments = 32
    const positions = [0, 0.02, 0]
    const normals = [0, 1, 0]
    const indices = []

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      positions.push(Math.cos(angle) * radius, 0.02, Math.sin(angle) * radius)
      normals.push(0, 1, 0)
    }

    for (let i = 1; i <= segments; i++) {
      indices.push(0, i, i + 1)
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geo.setIndex(indices)

    const mat = new THREE.MeshStandardMaterial({
      color: 0x3a7d32,
      roughness: 0.95,
      metalness: 0.0,
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(center[0], 0, center[1])
    mesh.receiveShadow = true
    mesh.name = `lawn_${id}`
    mesh.userData = { interactive: true, greeneryId: id, category: 'lawn' }
    this.greeneryGroup.add(mesh)
    return mesh
  }

  _createTreeGeometries() {
    const deciduous = new THREE.Group()

    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.35, 2.5, 8)
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.85,
      metalness: 0.05,
    })
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.y = 1.25
    trunk.castShadow = true
    trunk.receiveShadow = true
    deciduous.add(trunk)

    const branchGeo1 = new THREE.CylinderGeometry(0.06, 0.12, 1.2, 6)
    const branch1 = new THREE.Mesh(branchGeo1, trunkMat)
    branch1.position.set(0.3, 2.0, 0.2)
    branch1.rotation.z = -0.6
    branch1.castShadow = true
    deciduous.add(branch1)

    const branchGeo2 = new THREE.CylinderGeometry(0.05, 0.1, 1.0, 6)
    const branch2 = new THREE.Mesh(branchGeo2, trunkMat)
    branch2.position.set(-0.25, 2.2, -0.15)
    branch2.rotation.z = 0.5
    branch2.castShadow = true
    deciduous.add(branch2)

    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x2d8a27,
      roughness: 0.75,
      metalness: 0.0,
    })

    const foliage1Geo = new THREE.SphereGeometry(1.3, 10, 8)
    const foliage1 = new THREE.Mesh(foliage1Geo, foliageMat)
    foliage1.position.y = 3.2
    foliage1.scale.y = 0.75
    foliage1.castShadow = true
    foliage1.receiveShadow = true
    deciduous.add(foliage1)

    const foliage2Geo = new THREE.SphereGeometry(0.9, 8, 6)
    const foliage2 = new THREE.Mesh(foliage2Geo, foliageMat)
    foliage2.position.set(0.5, 3.6, 0.3)
    foliage2.scale.y = 0.7
    foliage2.castShadow = true
    deciduous.add(foliage2)

    const foliage3Geo = new THREE.SphereGeometry(0.8, 8, 6)
    const foliage3 = new THREE.Mesh(foliage3Geo, foliageMat)
    foliage3.position.set(-0.4, 3.5, -0.2)
    foliage3.scale.y = 0.7
    foliage3.castShadow = true
    deciduous.add(foliage3)

    const coniferous = new THREE.Group()

    const cTrunkGeo = new THREE.CylinderGeometry(0.12, 0.28, 2.0, 8)
    const cTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2e1f,
      roughness: 0.9,
      metalness: 0.05,
    })
    const cTrunk = new THREE.Mesh(cTrunkGeo, cTrunkMat)
    cTrunk.position.y = 1.0
    cTrunk.castShadow = true
    cTrunk.receiveShadow = true
    coniferous.add(cTrunk)

    const coneMat = new THREE.MeshStandardMaterial({
      color: 0x1a6b1a,
      roughness: 0.75,
      metalness: 0.0,
    })

    const layers = [
      { y: 2.0, radius: 1.4, height: 1.5 },
      { y: 3.0, radius: 1.1, height: 1.3 },
      { y: 3.8, radius: 0.8, height: 1.1 },
      { y: 4.4, radius: 0.5, height: 0.8 },
    ]

    for (const layer of layers) {
      const coneGeo = new THREE.ConeGeometry(layer.radius, layer.height, 10)
      const cone = new THREE.Mesh(coneGeo, coneMat)
      cone.position.y = layer.y
      cone.castShadow = true
      cone.receiveShadow = true
      coniferous.add(cone)
    }

    return { deciduous, coniferous }
  }

  updateAnimation(elapsed) {
    const children = this.greeneryGroup.children
    for (let i = 0, len = children.length; i < len; i++) {
      const group = children[i]
      if (group.isGroup && group.userData.category === 'tree') {
        group.rotation.z = Math.sin(elapsed * 0.5 + i * 0.7) * 0.02
      }
    }
  }

  dispose() {
    this.greeneryGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
        else child.material.dispose()
      }
    })
    this.scene.remove(this.greeneryGroup)
  }
}
