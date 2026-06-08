import * as THREE from 'three'

export class BuildingBuilder {
  constructor(scene) {
    this.scene = scene
    this.buildingGroup = new THREE.Group()
    this.buildingGroup.name = 'buildings'
    this.scene.add(this.buildingGroup)
    this.materials = this._createMaterials()
  }

  _createMaterials() {
    return {
      commercial: new THREE.MeshStandardMaterial({
        color: 0x4488cc,
        roughness: 0.3,
        metalness: 0.7,
      }),
      office: new THREE.MeshStandardMaterial({
        color: 0x6699bb,
        roughness: 0.5,
        metalness: 0.5,
      }),
      residential: new THREE.MeshStandardMaterial({
        color: 0xddaa77,
        roughness: 0.7,
        metalness: 0.2,
      }),
      retail: new THREE.MeshStandardMaterial({
        color: 0xcc6644,
        roughness: 0.4,
        metalness: 0.4,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        roughness: 0.05,
        metalness: 0.1,
        transmission: 0.6,
        transparent: true,
        opacity: 0.7,
      }),
      roof: new THREE.MeshStandardMaterial({
        color: 0x334455,
        roughness: 0.8,
        metalness: 0.3,
      })
    }
  }

  buildFromConfig(config) {
    for (const item of config) {
      this.createBuilding(item)
    }
  }

  createBuilding({ id, name, type, position, size, floors, info }) {
    const width = size[0]
    const depth = size[1]
    const height = floors * 3

    const group = new THREE.Group()
    group.name = `building_${id}`
    group.userData = {
      interactive: true,
      buildingId: id,
      buildingName: name,
      buildingType: type,
      buildingInfo: info,
      floors
    }

    const bodyGeo = this._createBuildingGeometry(width, height, depth)
    const bodyMat = this.materials[type] || this.materials.commercial
    const body = new THREE.Mesh(bodyGeo, bodyMat.clone())
    body.castShadow = true
    body.receiveShadow = true
    body.position.y = 0
    body.userData = { interactive: true, buildingId: id, buildingName: name, buildingType: type, buildingInfo: info, floors }
    group.add(body)

    this._addFloorLines(group, width, height, depth, floors)

    if (type === 'commercial' || type === 'office') {
      this._addGlassFacade(group, width, height, depth)
    }

    this._addRoof(group, width, height, depth, type)

    group.position.set(position[0], 0, position[1])
    this.buildingGroup.add(group)
    return group
  }

  _createBuildingGeometry(width, height, depth) {
    const geo = new THREE.BufferGeometry()
    const hw = width / 2
    const hd = depth / 2

    const positions = new Float32Array([
      -hw, 0, -hd,   hw, 0, -hd,   hw, 0,  hd,  -hw, 0,  hd,
      -hw, height, -hd,   hw, height, -hd,   hw, height,  hd,  -hw, height,  hd,
    ])

    const indices = [
      0,1,2, 0,2,3,
      5,4,7, 5,7,6,
      4,0,3, 4,3,7,
      1,5,6, 1,6,2,
      3,2,6, 3,6,7,
      4,5,1, 4,1,0,
    ]

    const normals = new Float32Array([
      0,-1,0,  0,-1,0,  0,-1,0,  0,-1,0,
      0,1,0,   0,1,0,   0,1,0,   0,1,0,
    ])

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
  }

  _addFloorLines(group, width, height, depth, floors) {
    const hw = width / 2 + 0.02
    const hd = depth / 2 + 0.02
    const lineMat = new THREE.LineBasicMaterial({ color: 0x222233, transparent: true, opacity: 0.5 })

    for (let i = 1; i < floors; i++) {
      const y = i * 3
      const points = [
        new THREE.Vector3(-hw, y, -hd),
        new THREE.Vector3( hw, y, -hd),
        new THREE.Vector3( hw, y,  hd),
        new THREE.Vector3(-hw, y,  hd),
        new THREE.Vector3(-hw, y, -hd),
      ]
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
      group.add(new THREE.Line(lineGeo, lineMat))
    }
  }

  _addGlassFacade(group, width, height, depth) {
    const glassGeo = new THREE.BoxGeometry(width + 0.1, height, depth + 0.1)
    const glass = new THREE.Mesh(glassGeo, this.materials.glass)
    glass.position.y = height / 2
    glass.userData = { interactive: true, buildingId: group.userData.buildingId }
    group.add(glass)
  }

  _addRoof(group, width, height, depth, type) {
    const hw = width / 2
    const hd = depth / 2
    const roofHeight = type === 'commercial' ? 3 : 1.5

    if (type === 'commercial') {
      const roofGeo = new THREE.BufferGeometry()
      const positions = new Float32Array([
        -hw, height, -hd,
         hw, height, -hd,
         hw, height,  hd,
        -hw, height,  hd,
        0, height + roofHeight, 0,
      ])
      const indices = [
        0,1,4, 1,2,4, 2,3,4, 3,0,4,
        0,1,2, 0,2,3,
      ]
      roofGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      roofGeo.setIndex(indices)
      roofGeo.computeVertexNormals()
      const roof = new THREE.Mesh(roofGeo, this.materials.roof)
      roof.castShadow = true
      roof.userData = { interactive: true, buildingId: group.userData.buildingId }
      group.add(roof)
    } else {
      const roofGeo = new THREE.BoxGeometry(width + 0.5, roofHeight, depth + 0.5)
      const roof = new THREE.Mesh(roofGeo, this.materials.roof)
      roof.position.y = height + roofHeight / 2
      roof.castShadow = true
      roof.userData = { interactive: true, buildingId: group.userData.buildingId }
      group.add(roof)
    }
  }

  getBuildingById(id) {
    return this.buildingGroup.children.find(g => g.userData.buildingId === id)
  }

  getAllBuildings() {
    return this.buildingGroup.children.map(g => ({
      id: g.userData.buildingId,
      name: g.userData.buildingName,
      type: g.userData.buildingType,
      info: g.userData.buildingInfo,
      position: [g.position.x, g.position.z],
      floors: g.userData.floors,
    }))
  }

  dispose() {
    this.buildingGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
        else child.material.dispose()
      }
    })
    this.scene.remove(this.buildingGroup)
  }
}
