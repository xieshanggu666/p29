import * as THREE from 'three'

export class FloorBuilder {
  constructor(scene) {
    this.scene = scene
    this._floorGroups = new Map()
    this._materials = this._createMaterials()
  }

  _createMaterials() {
    return {
      floorSlab: new THREE.MeshStandardMaterial({
        color: 0xd4c5a9,
        roughness: 0.85,
        metalness: 0.05,
      }),
      floorSlabBottom: new THREE.MeshStandardMaterial({
        color: 0xe8dcc8,
        roughness: 0.9,
        metalness: 0.02,
      }),
      stair: new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.7,
        metalness: 0.1,
      }),
      stairHandrail: new THREE.MeshStandardMaterial({
        color: 0x4a3728,
        roughness: 0.5,
        metalness: 0.3,
      }),
      elevatorShaft: new THREE.MeshStandardMaterial({
        color: 0x3a3a4a,
        roughness: 0.6,
        metalness: 0.4,
        side: THREE.DoubleSide,
      }),
      elevatorDoor: new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.3,
        metalness: 0.8,
      }),
      floorLabel: new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff8800,
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide,
      }),
      corridor: new THREE.MeshStandardMaterial({
        color: 0xc4b89a,
        roughness: 0.8,
        metalness: 0.05,
      }),
      column: new THREE.MeshStandardMaterial({
        color: 0x9a8b7a,
        roughness: 0.6,
        metalness: 0.2,
      }),
    }
  }

  buildFloors(buildingConfig, buildingGroup) {
    const { id, type, size, floors } = buildingConfig
    const width = size[0]
    const depth = size[1]

    const floorConfig = this._getFloorConfig(type, floors)
    const floorGroup = new THREE.Group()
    floorGroup.name = `floors_${id}`

    const floorHeight = floorConfig.floorHeight
    const slabThickness = floorConfig.slabThickness

    this._addFloorSlabs(floorGroup, width, depth, floors, floorHeight, slabThickness, type)
    this._addStructuralColumns(floorGroup, width, depth, floors, floorHeight, type)

    if (floorConfig.hasStairs) {
      this._addStaircase(floorGroup, width, depth, floors, floorHeight, slabThickness, floorConfig.stairPosition)
    }

    if (floorConfig.hasElevator) {
      this._addElevatorShaft(floorGroup, width, depth, floors, floorHeight, slabThickness, floorConfig.elevatorPosition)
    }

    if (floorConfig.showLabels) {
      this._addFloorLabels(floorGroup, width, depth, floors, floorHeight)
    }

    buildingGroup.add(floorGroup)
    this._floorGroups.set(id, floorGroup)

    return {
      floorGroup,
      floorHeight,
      slabThickness,
      totalHeight: floors * floorHeight,
      floorCount: floors,
    }
  }

  _getFloorConfig(buildingType, floorCount) {
    const configs = {
      commercial: {
        floorHeight: 3.6,
        slabThickness: 0.15,
        hasStairs: true,
        hasElevator: true,
        showLabels: true,
        stairPosition: { x: -1, z: -1 },
        elevatorPosition: { x: 1, z: -1 },
        elevatorCount: 2,
      },
      office: {
        floorHeight: 3.5,
        slabThickness: 0.12,
        hasStairs: true,
        hasElevator: true,
        showLabels: true,
        stairPosition: { x: -1.2, z: -0.8 },
        elevatorPosition: { x: 1.2, z: -0.8 },
        elevatorCount: 3,
      },
      retail: {
        floorHeight: 4.0,
        slabThickness: 0.18,
        hasStairs: true,
        hasElevator: true,
        showLabels: true,
        stairPosition: { x: -1.5, z: -1 },
        elevatorPosition: { x: 1.5, z: -1 },
        elevatorCount: 2,
      },
      residential: {
        floorHeight: 3.0,
        slabThickness: 0.12,
        hasStairs: true,
        hasElevator: floorCount > 6,
        showLabels: false,
        stairPosition: { x: -0.8, z: -0.6 },
        elevatorPosition: { x: 0.8, z: -0.6 },
        elevatorCount: 1,
      },
    }

    return configs[buildingType] || configs.commercial
  }

  _addFloorSlabs(group, width, depth, floorCount, floorHeight, slabThickness, buildingType) {
    const slabGroup = new THREE.Group()
    slabGroup.name = 'floorSlabs'

    const slabGeo = new THREE.BoxGeometry(width - 0.1, slabThickness, depth - 0.1)

    for (let i = 0; i <= floorCount; i++) {
      const y = i * floorHeight
      const slab = new THREE.Mesh(slabGeo, this._materials.floorSlab)
      slab.position.y = y
      slab.receiveShadow = true
      slab.castShadow = i > 0
      slab.userData = { floorIndex: i, isSlab: true }
      slab.name = `slab_${i}`
      slabGroup.add(slab)
    }

    if (buildingType === 'commercial' || buildingType === 'retail') {
      this._addCorridors(slabGroup, width, depth, floorCount, floorHeight)
    }

    group.add(slabGroup)
  }

  _addCorridors(slabGroup, width, depth, floorCount, floorHeight) {
    const corridorWidth = 1.5
    const corridorGeo = new THREE.BoxGeometry(width - 0.5, 0.02, corridorWidth)

    for (let i = 1; i < floorCount; i++) {
      const y = i * floorHeight + 0.08

      const corridor = new THREE.Mesh(corridorGeo, this._materials.corridor)
      corridor.position.set(0, y, 0)
      corridor.receiveShadow = true
      corridor.name = `corridor_${i}`
      slabGroup.add(corridor)
    }
  }

  _addStructuralColumns(group, width, depth, floorCount, floorHeight, buildingType) {
    const columnGroup = new THREE.Group()
    columnGroup.name = 'structuralColumns'

    const columnSize = buildingType === 'commercial' ? 0.3 : 0.25
    const columnGeo = new THREE.BoxGeometry(columnSize, floorHeight * floorCount, columnSize)

    const hw = width / 2 - columnSize / 2 - 0.1
    const hd = depth / 2 - columnSize / 2 - 0.1

    const columnPositions = [
      [-hw, -hd],
      [hw, -hd],
      [hw, hd],
      [-hw, hd],
    ]

    if (width > 8) {
      columnPositions.push([0, -hd])
      columnPositions.push([0, hd])
    }
    if (depth > 8) {
      columnPositions.push([-hw, 0])
      columnPositions.push([hw, 0])
    }

    for (const [x, z] of columnPositions) {
      const column = new THREE.Mesh(columnGeo, this._materials.column)
      column.position.set(x, (floorHeight * floorCount) / 2, z)
      column.castShadow = true
      column.receiveShadow = true
      column.name = 'column'
      columnGroup.add(column)
    }

    group.add(columnGroup)
  }

  _addStaircase(group, width, depth, floorCount, floorHeight, slabThickness, position) {
    const stairGroup = new THREE.Group()
    stairGroup.name = 'staircase'

    const stairWidth = Math.min(1.5, width * 0.15)
    const stairDepth = Math.min(2.0, depth * 0.2)
    const riserHeight = 0.15
    const treadDepth = 0.25

    const stepsPerFloor = Math.floor(floorHeight / riserHeight)
    const actualRiserHeight = floorHeight / stepsPerFloor

    const stairwellWidth = stairWidth + 0.3
    const stairwellDepth = stairDepth * 2 + 0.5

    const stairwellGeo = new THREE.BoxGeometry(stairwellWidth, floorHeight * floorCount, stairwellDepth)
    const stairwell = new THREE.Mesh(stairwellGeo, this._materials.elevatorShaft)
    stairwell.position.set(position.x, (floorHeight * floorCount) / 2, position.z)
    stairwell.name = 'stairwell'
    stairGroup.add(stairwell)

    const landingGeo = new THREE.BoxGeometry(stairWidth + 0.2, slabThickness, stairDepth + 0.2)

    for (let floor = 0; floor < floorCount; floor++) {
      const baseY = floor * floorHeight

      const landingBottom = new THREE.Mesh(landingGeo, this._materials.stair)
      landingBottom.position.set(position.x, baseY, position.z)
      landingBottom.receiveShadow = true
      landingBottom.castShadow = true
      landingBottom.name = `landing_bottom_${floor}`
      stairGroup.add(landingBottom)

      this._buildStairFlight(
        stairGroup,
        position.x,
        baseY,
        position.z - stairDepth / 2 + treadDepth / 2,
        stairWidth,
        treadDepth,
        actualRiserHeight,
        stepsPerFloor / 2,
        true,
        floor
      )

      const midLandingY = baseY + floorHeight / 2
      const midLanding = new THREE.Mesh(landingGeo, this._materials.stair)
      midLanding.position.set(position.x, midLandingY, position.z)
      midLanding.receiveShadow = true
      midLanding.castShadow = true
      midLanding.name = `landing_mid_${floor}`
      stairGroup.add(midLanding)

      this._buildStairFlight(
        stairGroup,
        position.x,
        midLandingY,
        position.z + stairDepth / 2 - treadDepth / 2,
        stairWidth,
        treadDepth,
        actualRiserHeight,
        stepsPerFloor / 2,
        false,
        floor
      )

      const landingTop = new THREE.Mesh(landingGeo, this._materials.stair)
      landingTop.position.set(position.x, baseY + floorHeight, position.z)
      landingTop.receiveShadow = true
      landingTop.castShadow = true
      landingTop.name = `landing_top_${floor}`
      stairGroup.add(landingTop)
    }

    this._addStairHandrails(stairGroup, position, floorCount, floorHeight, stairDepth, stairWidth)

    group.add(stairGroup)
  }

  _buildStairFlight(group, x, startY, startZ, width, treadDepth, riserHeight, stepCount, ascending, floorIndex) {
    const direction = ascending ? 1 : -1

    for (let i = 0; i < stepCount; i++) {
      const stepY = startY + i * riserHeight
      const stepZ = startZ + direction * i * treadDepth

      const riserGeo = new THREE.BoxGeometry(width, riserHeight, 0.02)
      const riser = new THREE.Mesh(riserGeo, this._materials.stair)
      riser.position.set(x, stepY + riserHeight / 2, stepZ + direction * (treadDepth / 2 - 0.01))
      riser.castShadow = true
      riser.name = `riser_${floorIndex}_${i}`
      group.add(riser)

      const treadGeo = new THREE.BoxGeometry(width, 0.02, treadDepth)
      const tread = new THREE.Mesh(treadGeo, this._materials.stair)
      tread.position.set(x, stepY + riserHeight - 0.01, stepZ + direction * treadDepth / 2)
      tread.receiveShadow = true
      tread.castShadow = true
      tread.name = `tread_${floorIndex}_${i}`
      group.add(tread)
    }
  }

  _addStairHandrails(group, position, floorCount, floorHeight, stairDepth, stairWidth) {
    const handrailHeight = 0.9
    const handrailRadius = 0.03
    const postRadius = 0.02

    const totalHeight = floorCount * floorHeight

    const outerHandrailGeo = new THREE.CylinderGeometry(handrailRadius, handrailRadius, totalHeight, 8)
    const innerHandrailGeo = new THREE.CylinderGeometry(handrailRadius, handrailRadius, totalHeight, 8)

    const handrailOffset = stairWidth / 2 + 0.05

    const outerHandrail = new THREE.Mesh(outerHandrailGeo, this._materials.stairHandrail)
    outerHandrail.position.set(
      position.x + handrailOffset,
      totalHeight / 2 + handrailHeight,
      position.z
    )
    outerHandrail.name = 'handrail_outer'
    group.add(outerHandrail)

    const innerHandrail = new THREE.Mesh(innerHandrailGeo, this._materials.stairHandrail)
    innerHandrail.position.set(
      position.x - handrailOffset,
      totalHeight / 2 + handrailHeight,
      position.z
    )
    innerHandrail.name = 'handrail_inner'
    group.add(innerHandrail)

    const postCount = floorCount * 4
    for (let i = 0; i <= postCount; i++) {
      const postY = (i / postCount) * totalHeight
      const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, handrailHeight, 6)

      const postOuter = new THREE.Mesh(postGeo, this._materials.stairHandrail)
      postOuter.position.set(
        position.x + handrailOffset,
        postY + handrailHeight / 2,
        position.z
      )
      postOuter.name = `handrail_post_outer_${i}`
      group.add(postOuter)

      const postInner = new THREE.Mesh(postGeo, this._materials.stairHandrail)
      postInner.position.set(
        position.x - handrailOffset,
        postY + handrailHeight / 2,
        position.z
      )
      postInner.name = `handrail_post_inner_${i}`
      group.add(postInner)
    }
  }

  _addElevatorShaft(group, width, depth, floorCount, floorHeight, slabThickness, position) {
    const elevatorGroup = new THREE.Group()
    elevatorGroup.name = 'elevatorShaft'

    const shaftWidth = 2.0
    const shaftDepth = 2.5
    const totalHeight = floorCount * floorHeight

    const shaftWallThickness = 0.15

    const backWallGeo = new THREE.BoxGeometry(shaftWidth, totalHeight, shaftWallThickness)
    const backWall = new THREE.Mesh(backWallGeo, this._materials.elevatorShaft)
    backWall.position.set(position.x, totalHeight / 2, position.z - shaftDepth / 2 + shaftWallThickness / 2)
    backWall.name = 'shaft_back_wall'
    elevatorGroup.add(backWall)

    const frontWallGeo = new THREE.BoxGeometry(shaftWidth, totalHeight, shaftWallThickness)
    const frontWall = new THREE.Mesh(frontWallGeo, this._materials.elevatorShaft)
    frontWall.position.set(position.x, totalHeight / 2, position.z + shaftDepth / 2 - shaftWallThickness / 2)
    frontWall.name = 'shaft_front_wall'
    elevatorGroup.add(frontWall)

    const sideWallGeo = new THREE.BoxGeometry(shaftWallThickness, totalHeight, shaftDepth)
    const leftWall = new THREE.Mesh(sideWallGeo, this._materials.elevatorShaft)
    leftWall.position.set(position.x - shaftWidth / 2 + shaftWallThickness / 2, totalHeight / 2, position.z)
    leftWall.name = 'shaft_left_wall'
    elevatorGroup.add(leftWall)

    const rightWall = new THREE.Mesh(sideWallGeo, this._materials.elevatorShaft)
    rightWall.position.set(position.x + shaftWidth / 2 - shaftWallThickness / 2, totalHeight / 2, position.z)
    rightWall.name = 'shaft_right_wall'
    elevatorGroup.add(rightWall)

    const doorWidth = shaftWidth * 0.7
    const doorHeight = 2.2

    for (let i = 0; i < floorCount; i++) {
      const doorY = i * floorHeight + doorHeight / 2

      const leftDoorGeo = new THREE.BoxGeometry(doorWidth / 2 - 0.02, doorHeight, 0.08)
      const leftDoor = new THREE.Mesh(leftDoorGeo, this._materials.elevatorDoor)
      leftDoor.position.set(
        position.x - doorWidth / 4,
        doorY,
        position.z + shaftDepth / 2 - shaftWallThickness
      )
      leftDoor.name = `elevator_door_left_${i}`
      elevatorGroup.add(leftDoor)

      const rightDoorGeo = new THREE.BoxGeometry(doorWidth / 2 - 0.02, doorHeight, 0.08)
      const rightDoor = new THREE.Mesh(rightDoorGeo, this._materials.elevatorDoor)
      rightDoor.position.set(
        position.x + doorWidth / 4,
        doorY,
        position.z + shaftDepth / 2 - shaftWallThickness
      )
      rightDoor.name = `elevator_door_right_${i}`
      elevatorGroup.add(rightDoor)

      const doorFrameGeo = new THREE.BoxGeometry(doorWidth + 0.1, doorHeight + 0.1, 0.05)
      const doorFrame = new THREE.Mesh(doorFrameGeo, this._materials.stairHandrail)
      doorFrame.position.set(
        position.x,
        doorY,
        position.z + shaftDepth / 2 - shaftWallThickness / 2 - 0.01
      )
      doorFrame.name = `elevator_door_frame_${i}`
      elevatorGroup.add(doorFrame)
    }

    const carHeight = 2.0
    const carGeo = new THREE.BoxGeometry(shaftWidth - 0.3, carHeight, shaftDepth - 0.3)
    const carMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.4,
      metalness: 0.6,
    })
    const elevatorCar = new THREE.Mesh(carGeo, carMat)
    elevatorCar.position.set(position.x, floorHeight / 2, position.z)
    elevatorCar.castShadow = true
    elevatorCar.name = 'elevator_car'
    elevatorCar.userData = {
      isElevatorCar: true,
      baseY: floorHeight / 2,
      speed: 2.0,
      floorHeight: floorHeight,
      floors: floorCount,
    }
    elevatorGroup.add(elevatorCar)

    const cableGeo = new THREE.CylinderGeometry(0.015, 0.015, totalHeight, 4)
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.6,
      metalness: 0.7,
    })

    const cablePositions = [
      [-shaftWidth / 3, 0],
      [shaftWidth / 3, 0],
      [0, -shaftDepth / 3],
      [0, shaftDepth / 3],
    ]

    for (let i = 0; i < cablePositions.length; i++) {
      const [cx, cz] = cablePositions[i]
      const cable = new THREE.Mesh(cableGeo, cableMat)
      cable.position.set(position.x + cx, totalHeight / 2, position.z + cz)
      cable.name = `elevator_cable_${i}`
      elevatorGroup.add(cable)
    }

    group.add(elevatorGroup)
  }

  _addFloorLabels(group, width, depth, floorCount, floorHeight) {
    const labelGroup = new THREE.Group()
    labelGroup.name = 'floorLabels'

    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 64
    const ctx = canvas.getContext('2d')

    for (let i = 0; i < floorCount; i++) {
      const y = i * floorHeight + floorHeight / 2

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = 'bold 36px Arial'
      ctx.fillStyle = '#ffaa00'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${i + 1}F`, canvas.width / 2, canvas.height / 2)

      ctx.font = '18px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`${(y - floorHeight / 2).toFixed(1)}m`, canvas.width / 2, canvas.height / 2 + 22)

      const texture = new THREE.CanvasTexture(canvas)
      const labelMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      })

      const labelGeo = new THREE.PlaneGeometry(1.2, 0.6)

      const labelFront = new THREE.Mesh(labelGeo, labelMat.clone())
      labelFront.position.set(0, y, depth / 2 - 0.05)
      labelFront.name = `floor_label_front_${i}`
      labelGroup.add(labelFront)

      const labelBack = new THREE.Mesh(labelGeo, labelMat.clone())
      labelBack.position.set(0, y, -depth / 2 + 0.05)
      labelBack.rotation.y = Math.PI
      labelBack.name = `floor_label_back_${i}`
      labelGroup.add(labelBack)
    }

    group.add(labelGroup)
  }

  updateAnimation(delta, elapsed) {
    for (const [, floorGroup] of this._floorGroups) {
      const elevatorCar = floorGroup.getObjectByName('elevator_car')
      if (elevatorCar && elevatorCar.userData.isElevatorCar) {
        const { baseY, speed, floorHeight, floors } = elevatorCar.userData

        const cycleTime = (floors * floorHeight) / speed
        const phase = (elapsed % cycleTime) / cycleTime

        let targetFloor
        if (phase < 0.5) {
          targetFloor = phase * 2 * (floors - 1)
        } else {
          targetFloor = (1 - phase) * 2 * (floors - 1)
        }

        const targetY = baseY + targetFloor * floorHeight
        elevatorCar.position.y += (targetY - elevatorCar.position.y) * delta * 2
      }
    }
  }

  getFloorInfo(buildingId) {
    const floorGroup = this._floorGroups.get(buildingId)
    if (!floorGroup) return null

    const buildingGroup = floorGroup.parent
    return {
      buildingId,
      floorCount: buildingGroup.userData.floors,
      floorHeight: 3.5,
      totalHeight: buildingGroup.userData.floors * 3.5,
      hasStairs: floorGroup.getObjectByName('staircase') !== null,
      hasElevator: floorGroup.getObjectByName('elevatorShaft') !== null,
    }
  }

  setFloorsVisible(buildingId, visible) {
    const floorGroup = this._floorGroups.get(buildingId)
    if (floorGroup) {
      floorGroup.visible = visible
    }
  }

  setAllFloorsVisible(visible) {
    for (const [, floorGroup] of this._floorGroups) {
      floorGroup.visible = visible
    }
  }

  dispose() {
    for (const [, floorGroup] of this._floorGroups) {
      floorGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material.dispose()
          }
          if (child.material.map) {
            child.material.map.dispose()
          }
        }
      })
    }
    this._floorGroups.clear()

    for (const key in this._materials) {
      if (this._materials[key]) {
        this._materials[key].dispose()
      }
    }
  }
}
