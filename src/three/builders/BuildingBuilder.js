import * as THREE from 'three'
import { FloorBuilder } from './FloorBuilder.js'

export class BuildingBuilder {
  constructor(scene) {
    this.scene = scene
    this.buildingGroup = new THREE.Group()
    this.buildingGroup.name = 'buildings'
    this.scene.add(this.buildingGroup)
    this.materials = this._createMaterials()
    this._roofLights = []
    this.floorBuilder = new FloorBuilder(scene)
    this._showInterior = false
    this._buildingData = new Map()
  }

  _createMaterials() {
    return {
      commercial: new THREE.MeshPhysicalMaterial({
        color: 0x4488cc,
        roughness: 0.25,
        metalness: 0.8,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2,
        envMapIntensity: 1.5,
      }),
      office: new THREE.MeshPhysicalMaterial({
        color: 0x6699bb,
        roughness: 0.35,
        metalness: 0.6,
        clearcoat: 0.2,
        clearcoatRoughness: 0.3,
        envMapIntensity: 1.3,
      }),
      residential: new THREE.MeshPhysicalMaterial({
        color: 0xddaa77,
        roughness: 0.65,
        metalness: 0.15,
        clearcoat: 0.1,
        clearcoatRoughness: 0.4,
      }),
      retail: new THREE.MeshPhysicalMaterial({
        color: 0xcc6644,
        roughness: 0.3,
        metalness: 0.5,
        clearcoat: 0.25,
        clearcoatRoughness: 0.2,
        envMapIntensity: 1.4,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x99ccff,
        roughness: 0.02,
        metalness: 0.05,
        transmission: 0.75,
        transparent: true,
        opacity: 0.5,
        ior: 1.5,
        thickness: 0.1,
        envMapIntensity: 2.0,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      }),
      roof: new THREE.MeshStandardMaterial({
        color: 0x334455,
        roughness: 0.75,
        metalness: 0.35,
      }),
      windowFrame: new THREE.MeshStandardMaterial({
        color: 0x222233,
        roughness: 0.4,
        metalness: 0.6,
      }),
      windowGlow: new THREE.MeshStandardMaterial({
        color: 0xffeecc,
        emissive: 0xffeeaa,
        emissiveIntensity: 0.15,
        roughness: 0.3,
        metalness: 0.1,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0x556677,
        roughness: 0.3,
        metalness: 0.7,
      }),
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

    const floorConfig = this._getFloorHeightConfig(type)
    const floorHeight = floorConfig.floorHeight
    const height = floors * floorHeight

    const group = new THREE.Group()
    group.name = `building_${id}`
    group.userData = {
      interactive: true,
      buildingId: id,
      buildingName: name,
      buildingType: type,
      buildingInfo: info,
      floors,
      floorHeight,
      totalHeight: height,
    }

    const bodyGeo = this._createBuildingGeometry(width, height, depth)
    const bodyMat = this.materials[type] || this.materials.commercial
    const body = new THREE.Mesh(bodyGeo, bodyMat.clone())
    body.castShadow = true
    body.receiveShadow = true
    body.position.y = 0
    body.userData = { interactive: true, buildingId: id, buildingName: name, buildingType: type, buildingInfo: info, floors }
    body.name = 'buildingBody'
    group.add(body)

    this._addMergedWindows(group, width, height, depth, floors, type)

    if (type === 'commercial' || type === 'office') {
      this._addGlassFacade(group, width, height, depth)
      this._addFacadeAccent(group, width, height, depth)
    }

    this._addRoof(group, width, height, depth, type)

    const floorResult = this.floorBuilder.buildFloors(
      { id, type, size, floors },
      group
    )

    this.floorBuilder.setFloorsVisible(id, false)

    const buildingData = {
      id,
      name,
      type,
      position,
      size,
      floors,
      floorHeight,
      totalHeight: height,
      group,
      bodyMesh: body,
      floorResult,
    }
    this._buildingData.set(id, buildingData)

    group.position.set(position[0], 0, position[1])
    this.buildingGroup.add(group)
    return group
  }

  _getFloorHeightConfig(buildingType) {
    const configs = {
      commercial: { floorHeight: 3.6, slabThickness: 0.15 },
      office: { floorHeight: 3.5, slabThickness: 0.12 },
      retail: { floorHeight: 4.0, slabThickness: 0.18 },
      residential: { floorHeight: 3.0, slabThickness: 0.12 },
    }
    return configs[buildingType] || configs.commercial
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

  _addMergedWindows(group, width, height, depth, floors, type) {
    const hw = width / 2 + 0.06
    const hd = depth / 2 + 0.06
    const floorHeight = 3
    const windowWidth = type === 'residential' ? 0.8 : 1.0
    const windowHeight = type === 'residential' ? 1.2 : 1.6
    const windowDepth = 0.08

    const frameGeo = new THREE.BoxGeometry(windowWidth + 0.1, windowHeight + 0.1, windowDepth)
    const paneGeo = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth * 0.5)

    const sides = [
      { axis: 'z', sign: 1, pos: [0, 0, hd], rotY: 0 },
      { axis: 'z', sign: -1, pos: [0, 0, -hd], rotY: Math.PI },
      { axis: 'x', sign: 1, pos: [hw, 0, 0], rotY: Math.PI / 2 },
      { axis: 'x', sign: -1, pos: [-hw, 0, 0], rotY: -Math.PI / 2 },
    ]

    const frameMatrices = []
    const paneMatrices = []

    const tempMatrix = new THREE.Matrix4()
    const rotationMatrix = new THREE.Matrix4()

    for (const side of sides) {
      const sideWidth = side.axis === 'z' ? width : depth
      const windowsPerFloor = Math.max(1, Math.floor(sideWidth / (windowWidth + 0.6)))
      const spacing = sideWidth / (windowsPerFloor + 1)
      const startOffset = -sideWidth / 2 + spacing

      rotationMatrix.makeRotationY(side.rotY)

      for (let floor = 0; floor < floors; floor++) {
        const yBase = floor * floorHeight + floorHeight * 0.35

        for (let w = 0; w < windowsPerFloor; w++) {
          const offset = startOffset + w * spacing
          const localX = side.axis === 'z' ? offset : 0
          const localZ = side.axis === 'x' ? offset : 0

          tempMatrix.makeTranslation(
            localX + side.pos[0],
            yBase + windowHeight / 2,
            localZ + side.pos[2]
          )
          tempMatrix.premultiply(rotationMatrix)
          frameMatrices.push(tempMatrix.clone())

          tempMatrix.makeTranslation(
            localX + side.pos[0],
            yBase + windowHeight / 2,
            localZ + side.pos[2] + 0.02 * side.sign
          )
          tempMatrix.premultiply(rotationMatrix)
          paneMatrices.push(tempMatrix.clone())
        }
      }
    }

    if (frameMatrices.length > 0) {
      const frameInstanced = new THREE.InstancedMesh(frameGeo, this.materials.windowFrame, frameMatrices.length)
      for (let i = 0; i < frameMatrices.length; i++) {
        frameInstanced.setMatrixAt(i, frameMatrices[i])
      }
      frameInstanced.instanceMatrix.needsUpdate = true
      group.add(frameInstanced)

      const paneInstanced = new THREE.InstancedMesh(paneGeo, this.materials.windowGlow, paneMatrices.length)
      for (let i = 0; i < paneMatrices.length; i++) {
        paneInstanced.setMatrixAt(i, paneMatrices[i])
      }
      paneInstanced.instanceMatrix.needsUpdate = true
      group.add(paneInstanced)
    }
  }

  _addGlassFacade(group, width, height, depth) {
    const glassGeo = new THREE.BoxGeometry(width + 0.1, height, depth + 0.1)
    const glass = new THREE.Mesh(glassGeo, this.materials.glass)
    glass.position.y = height / 2
    glass.userData = { interactive: true, buildingId: group.userData.buildingId }
    glass.name = 'glassFacade'
    group.add(glass)
  }

  _addFacadeAccent(group, width, height, depth) {
    const accentMat = this.materials.accent

    const cornerGeo = new THREE.BoxGeometry(0.15, height, 0.15)
    const hw = width / 2 + 0.06
    const hd = depth / 2 + 0.06
    const corners = [
      [-hw, height / 2, -hd], [hw, height / 2, -hd],
      [hw, height / 2, hd], [-hw, height / 2, hd],
    ]
    for (const pos of corners) {
      const corner = new THREE.Mesh(cornerGeo, accentMat)
      corner.position.set(pos[0], pos[1], pos[2])
      corner.castShadow = true
      group.add(corner)
    }

    const horizontalGeo = new THREE.BoxGeometry(width + 0.12, 0.12, depth + 0.12)
    const bandPositions = [0, height, height * 0.5]
    for (const y of bandPositions) {
      const band = new THREE.Mesh(horizontalGeo, accentMat)
      band.position.y = y
      band.castShadow = true
      group.add(band)
    }
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

      this._addRoofDetails(group, width, height + roofHeight, depth)
    } else {
      const roofGeo = new THREE.BoxGeometry(width + 0.5, roofHeight, depth + 0.5)
      const roof = new THREE.Mesh(roofGeo, this.materials.roof)
      roof.position.y = height + roofHeight / 2
      roof.castShadow = true
      roof.userData = { interactive: true, buildingId: group.userData.buildingId }
      group.add(roof)
    }
  }

  _addRoofDetails(group, width, peakY, depth) {
    const antennaMat = new THREE.MeshStandardMaterial({
      color: 0x888899,
      roughness: 0.3,
      metalness: 0.8,
    })
    const antennaGeo = new THREE.CylinderGeometry(0.03, 0.05, 3, 6)
    const antenna = new THREE.Mesh(antennaGeo, antennaMat)
    antenna.position.set(0, peakY + 1.5, 0)
    antenna.castShadow = true
    group.add(antenna)

    const lightGeo = new THREE.SphereGeometry(0.08, 6, 4)
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
    })
    const light = new THREE.Mesh(lightGeo, lightMat)
    light.position.set(0, peakY + 3.1, 0)
    group.add(light)
    this._roofLights.push(light)

    const acGeo = new THREE.BoxGeometry(1.5, 0.5, 1.0)
    const acMat = new THREE.MeshStandardMaterial({
      color: 0x777788,
      roughness: 0.6,
      metalness: 0.4,
    })
    const ac = new THREE.Mesh(acGeo, acMat)
    ac.position.set(width / 4, peakY + 0.25, depth / 4)
    ac.castShadow = true
    group.add(ac)
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

  updateAnimation(delta, elapsed) {
    for (const light of this._roofLights) {
      light.material.emissiveIntensity = 0.3 + Math.sin(elapsed * 2) * 0.3
    }
    this.floorBuilder.updateAnimation(delta, elapsed)
  }

  toggleInteriorView() {
    this._showInterior = !this._showInterior
    this.setInteriorView(this._showInterior)
    return this._showInterior
  }

  setInteriorView(show) {
    this._showInterior = show
    for (const [, data] of this._buildingData) {
      this._setBuildingInteriorVisible(data, show)
    }
  }

  _setBuildingInteriorVisible(buildingData, show) {
    const { group, bodyMesh } = buildingData

    if (show) {
      if (bodyMesh.material) {
        bodyMesh.material.transparent = true
        bodyMesh.material.opacity = 0.12
        bodyMesh.material.depthWrite = false
      }

      const glassFacade = group.getObjectByName ? group.getObjectByName('glassFacade') : null
      if (glassFacade) {
        glassFacade.visible = false
      }
    } else {
      if (bodyMesh.material) {
        bodyMesh.material.transparent = false
        bodyMesh.material.opacity = 1
        bodyMesh.material.depthWrite = true
      }

      const glassFacade = group.getObjectByName ? group.getObjectByName('glassFacade') : null
      if (glassFacade) {
        glassFacade.visible = true
      }
    }

    this.floorBuilder.setFloorsVisible(buildingData.id, show)
  }

  setBuildingInteriorView(buildingId, show) {
    const buildingData = this._buildingData.get(buildingId)
    if (buildingData) {
      this._setBuildingInteriorVisible(buildingData, show)
    }
  }

  getFloorBuilder() {
    return this.floorBuilder
  }

  getBuildingFloorInfo(buildingId) {
    return this.floorBuilder.getFloorInfo(buildingId)
  }

  getAllBuildingFloorInfo() {
    const result = []
    for (const [id] of this._buildingData) {
      const info = this.floorBuilder.getFloorInfo(id)
      if (info) result.push(info)
    }
    return result
  }

  dispose() {
    this._roofLights = []
    this.floorBuilder.dispose()
    this._buildingData.clear()
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
