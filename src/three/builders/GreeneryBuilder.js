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
        child.material = child.material.clone()
        child.castShadow = true
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

    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 2, 6)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 })
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.y = 1
    deciduous.add(trunk)

    const foliageGeo = new THREE.SphereGeometry(1.5, 8, 6)
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d8a27, roughness: 0.8 })
    const foliage = new THREE.Mesh(foliageGeo, foliageMat)
    foliage.position.y = 3.2
    foliage.scale.y = 0.8
    deciduous.add(foliage)

    const coniferous = new THREE.Group()

    const cTrunkGeo = new THREE.CylinderGeometry(0.15, 0.3, 1.5, 6)
    const cTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2e1f, roughness: 0.9 })
    const cTrunk = new THREE.Mesh(cTrunkGeo, cTrunkMat)
    cTrunk.position.y = 0.75
    coniferous.add(cTrunk)

    const coneGeo = new THREE.ConeGeometry(1.2, 3.5, 8)
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x1a6b1a, roughness: 0.8 })
    const cone = new THREE.Mesh(coneGeo, coneMat)
    cone.position.y = 3.25
    coniferous.add(cone)

    return { deciduous, coniferous }
  }

  updateAnimation(elapsed) {
    this.greeneryGroup.children.forEach((group, i) => {
      if (group.isGroup && group.userData.category === 'tree') {
        group.rotation.z = Math.sin(elapsed * 0.5 + i * 0.7) * 0.02
      }
    })
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
