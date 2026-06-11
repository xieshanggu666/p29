import * as THREE from 'three'

export class FloorBuilder {
  constructor(scene) {
    this.scene = scene
    this._floorGroups = new Map()
    this._materials = this._createMaterials()
    this._tempMatrix = new THREE.Matrix4()
    this._tempVector = new THREE.Vector3()
    this._tempQuaternion = new THREE.Quaternion()
    this._elevatorCars = []
  }

  _createMaterials() {
    return {
      floorSlab: new THREE.MeshStandardMaterial({
        color: 0xd4c5a9,
        roughness: 0.85,
        metalness: 0.05,
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

    this._addFloorLabels(floorGroup, width, depth, floors, floorHeight, floorConfig.showLabels)

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

    const slabCount = floorCount + 1
    const slabGeo = new THREE.BoxGeometry(width - 0.1, slabThickness, depth - 0.1)
    const slabInstanced = new THREE.InstancedMesh(slabGeo, this._materials.floorSlab, slabCount)
    slabInstanced.name = 'slabs_instanced'
    slabInstanced.receiveShadow = true
    slabInstanced.castShadow = false

    for (let i = 0; i < slabCount; i++) {
      const y = i * floorHeight
      this._tempVector.set(0, y, 0)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      slabInstanced.setMatrixAt(i, this._tempMatrix)
      slabInstanced.setColorAt(i, new THREE.Color(0xd4c5a9))
    }
    slabInstanced.instanceMatrix.needsUpdate = true
    slabGroup.add(slabInstanced)

    if (buildingType === 'commercial' || buildingType === 'retail') {
      this._addCorridors(slabGroup, width, depth, floorCount, floorHeight)
    }

    group.add(slabGroup)
  }

  _addCorridors(slabGroup, width, depth, floorCount, floorHeight) {
    const corridorCount = Math.max(0, floorCount - 1)
    if (corridorCount === 0) return

    const corridorWidth = 1.5
    const corridorGeo = new THREE.BoxGeometry(width - 0.5, 0.02, corridorWidth)
    const corridorInstanced = new THREE.InstancedMesh(corridorGeo, this._materials.corridor, corridorCount)
    corridorInstanced.name = 'corridors_instanced'
    corridorInstanced.receiveShadow = true

    let idx = 0
    for (let i = 1; i < floorCount; i++) {
      const y = i * floorHeight + 0.08
      this._tempVector.set(0, y, 0)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      corridorInstanced.setMatrixAt(idx, this._tempMatrix)
      idx++
    }
    corridorInstanced.instanceMatrix.needsUpdate = true
    slabGroup.add(corridorInstanced)
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

    const columnCount = columnPositions.length
    const columnInstanced = new THREE.InstancedMesh(columnGeo, this._materials.column, columnCount)
    columnInstanced.name = 'columns_instanced'
    columnInstanced.castShadow = true
    columnInstanced.receiveShadow = true

    const centerY = (floorHeight * floorCount) / 2
    for (let i = 0; i < columnCount; i++) {
      const [x, z] = columnPositions[i]
      this._tempVector.set(x, centerY, z)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      columnInstanced.setMatrixAt(i, this._tempMatrix)
    }
    columnInstanced.instanceMatrix.needsUpdate = true
    columnGroup.add(columnInstanced)

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
    const halfSteps = Math.floor(stepsPerFloor / 2)

    const stairwellWidth = stairWidth + 0.3
    const stairwellDepth = stairDepth * 2 + 0.5
    const totalHeight = floorCount * floorHeight

    const stairwellGeo = new THREE.BoxGeometry(stairwellWidth, totalHeight, stairwellDepth)
    const stairwell = new THREE.Mesh(stairwellGeo, this._materials.elevatorShaft)
    stairwell.position.set(position.x, totalHeight / 2, position.z)
    stairwell.name = 'stairwell'
    stairGroup.add(stairwell)

    const landingGeo = new THREE.BoxGeometry(stairWidth + 0.2, slabThickness, stairDepth + 0.2)
    const landingCount = floorCount * 3
    const landingInstanced = new THREE.InstancedMesh(landingGeo, this._materials.stair, landingCount)
    landingInstanced.name = 'landings_instanced'
    landingInstanced.receiveShadow = true
    landingInstanced.castShadow = true

    let landingIdx = 0
    for (let floor = 0; floor < floorCount; floor++) {
      const baseY = floor * floorHeight

      this._tempVector.set(position.x, baseY, position.z)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      landingInstanced.setMatrixAt(landingIdx++, this._tempMatrix)

      const midY = baseY + floorHeight / 2
      this._tempVector.set(position.x, midY, position.z)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      landingInstanced.setMatrixAt(landingIdx++, this._tempMatrix)

      const topY = baseY + floorHeight
      this._tempVector.set(position.x, topY, position.z)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      landingInstanced.setMatrixAt(landingIdx++, this._tempMatrix)
    }
    landingInstanced.instanceMatrix.needsUpdate = true
    stairGroup.add(landingInstanced)

    const riserGeo = new THREE.BoxGeometry(stairWidth, actualRiserHeight, 0.02)
    const treadGeo = new THREE.BoxGeometry(stairWidth, 0.02, treadDepth)

    const totalRiserCount = floorCount * halfSteps * 2
    const riserInstanced = new THREE.InstancedMesh(riserGeo, this._materials.stair, totalRiserCount)
    riserInstanced.name = 'risers_instanced'
    riserInstanced.castShadow = true

    const treadInstanced = new THREE.InstancedMesh(treadGeo, this._materials.stair, totalRiserCount)
    treadInstanced.name = 'treads_instanced'
    treadInstanced.receiveShadow = true
    treadInstanced.castShadow = true

    let stepIdx = 0
    for (let floor = 0; floor < floorCount; floor++) {
      const baseY = floor * floorHeight

      this._populateStairFlight(
        riserInstanced,
        treadInstanced,
        stepIdx,
        position.x,
        baseY,
        position.z - stairDepth / 2 + treadDepth / 2,
        actualRiserHeight,
        treadDepth,
        halfSteps,
        1
      )
      stepIdx += halfSteps

      this._populateStairFlight(
        riserInstanced,
        treadInstanced,
        stepIdx,
        position.x,
        baseY + floorHeight / 2,
        position.z + stairDepth / 2 - treadDepth / 2,
        actualRiserHeight,
        treadDepth,
        halfSteps,
        -1
      )
      stepIdx += halfSteps
    }
    riserInstanced.instanceMatrix.needsUpdate = true
    treadInstanced.instanceMatrix.needsUpdate = true
    stairGroup.add(riserInstanced)
    stairGroup.add(treadInstanced)

    this._addStairHandrails(stairGroup, position, floorCount, floorHeight, stairDepth, stairWidth)

    group.add(stairGroup)
  }

  _populateStairFlight(riserInstanced, treadInstanced, startIdx, x, startY, startZ, riserHeight, treadDepth, stepCount, direction) {
    for (let i = 0; i < stepCount; i++) {
      const stepY = startY + i * riserHeight
      const stepZ = startZ + direction * i * treadDepth

      this._tempVector.set(x, stepY + riserHeight / 2, stepZ + direction * (treadDepth / 2 - 0.01))
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      riserInstanced.setMatrixAt(startIdx + i, this._tempMatrix)

      this._tempVector.set(x, stepY + riserHeight - 0.01, stepZ + direction * treadDepth / 2)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      treadInstanced.setMatrixAt(startIdx + i, this._tempMatrix)
    }
  }

  _addStairHandrails(group, position, floorCount, floorHeight, stairDepth, stairWidth) {
    const handrailHeight = 0.9
    const handrailRadius = 0.03
    const totalHeight = floorCount * floorHeight

    const handrailGeo = new THREE.CylinderGeometry(handrailRadius, handrailRadius, totalHeight, 8)

    const handrailInstanced = new THREE.InstancedMesh(handrailGeo, this._materials.stairHandrail, 2)
    handrailInstanced.name = 'handrails_instanced'

    const handrailOffset = stairWidth / 2 + 0.05

    this._tempVector.set(position.x + handrailOffset, totalHeight / 2 + handrailHeight, position.z)
    this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
    handrailInstanced.setMatrixAt(0, this._tempMatrix)

    this._tempVector.set(position.x - handrailOffset, totalHeight / 2 + handrailHeight, position.z)
    this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
    handrailInstanced.setMatrixAt(1, this._tempMatrix)

    handrailInstanced.instanceMatrix.needsUpdate = true
    group.add(handrailInstanced)

    const postCount = Math.min(floorCount * 2, 8)
    const postRadius = 0.02
    const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, handrailHeight, 6)
    const postInstanced = new THREE.InstancedMesh(postGeo, this._materials.stairHandrail, postCount * 2)
    postInstanced.name = 'handrail_posts_instanced'

    let postIdx = 0
    for (let i = 0; i < postCount; i++) {
      const postY = (i / postCount) * totalHeight

      this._tempVector.set(position.x + handrailOffset, postY + handrailHeight / 2, position.z)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      postInstanced.setMatrixAt(postIdx++, this._tempMatrix)

      this._tempVector.set(position.x - handrailOffset, postY + handrailHeight / 2, position.z)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      postInstanced.setMatrixAt(postIdx++, this._tempMatrix)
    }
    postInstanced.instanceMatrix.needsUpdate = true
    group.add(postInstanced)
  }

  _addElevatorShaft(group, width, depth, floorCount, floorHeight, slabThickness, position) {
    const elevatorGroup = new THREE.Group()
    elevatorGroup.name = 'elevatorShaft'

    const shaftWidth = 2.0
    const shaftDepth = 2.5
    const totalHeight = floorCount * floorHeight
    const shaftWallThickness = 0.15

    const shaftWallMat = this._materials.elevatorShaft

    const backWallGeo = new THREE.BoxGeometry(shaftWidth, totalHeight, shaftWallThickness)
    const backWall = new THREE.Mesh(backWallGeo, shaftWallMat)
    backWall.position.set(position.x, totalHeight / 2, position.z - shaftDepth / 2 + shaftWallThickness / 2)
    backWall.name = 'shaft_back_wall'
    elevatorGroup.add(backWall)

    const frontWallGeo = new THREE.BoxGeometry(shaftWidth, totalHeight, shaftWallThickness)
    const frontWall = new THREE.Mesh(frontWallGeo, shaftWallMat)
    frontWall.position.set(position.x, totalHeight / 2, position.z + shaftDepth / 2 - shaftWallThickness / 2)
    frontWall.name = 'shaft_front_wall'
    elevatorGroup.add(frontWall)

    const sideWallGeo = new THREE.BoxGeometry(shaftWallThickness, totalHeight, shaftDepth)
    const leftWall = new THREE.Mesh(sideWallGeo, shaftWallMat)
    leftWall.position.set(position.x - shaftWidth / 2 + shaftWallThickness / 2, totalHeight / 2, position.z)
    leftWall.name = 'shaft_left_wall'
    elevatorGroup.add(leftWall)

    const rightWall = new THREE.Mesh(sideWallGeo, shaftWallMat)
    rightWall.position.set(position.x + shaftWidth / 2 - shaftWallThickness / 2, totalHeight / 2, position.z)
    rightWall.name = 'shaft_right_wall'
    elevatorGroup.add(rightWall)

    const doorWidth = shaftWidth * 0.7
    const doorHeight = 2.2
    const halfDoorWidth = doorWidth / 2 - 0.02

    const leftDoorGeo = new THREE.BoxGeometry(halfDoorWidth, doorHeight, 0.08)
    const rightDoorGeo = new THREE.BoxGeometry(halfDoorWidth, doorHeight, 0.08)
    const frameGeo = new THREE.BoxGeometry(doorWidth + 0.1, doorHeight + 0.1, 0.05)

    const leftDoorInstanced = new THREE.InstancedMesh(leftDoorGeo, this._materials.elevatorDoor, floorCount)
    leftDoorInstanced.name = 'elevator_doors_left_instanced'

    const rightDoorInstanced = new THREE.InstancedMesh(rightDoorGeo, this._materials.elevatorDoor, floorCount)
    rightDoorInstanced.name = 'elevator_doors_right_instanced'

    const frameInstanced = new THREE.InstancedMesh(frameGeo, this._materials.stairHandrail, floorCount)
    frameInstanced.name = 'elevator_doors_frame_instanced'

    const doorZ = position.z + shaftDepth / 2 - shaftWallThickness
    const frameZ = position.z + shaftDepth / 2 - shaftWallThickness / 2 - 0.01

    for (let i = 0; i < floorCount; i++) {
      const doorY = i * floorHeight + doorHeight / 2

      this._tempVector.set(position.x - doorWidth / 4, doorY, doorZ)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      leftDoorInstanced.setMatrixAt(i, this._tempMatrix)

      this._tempVector.set(position.x + doorWidth / 4, doorY, doorZ)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      rightDoorInstanced.setMatrixAt(i, this._tempMatrix)

      this._tempVector.set(position.x, doorY, frameZ)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      frameInstanced.setMatrixAt(i, this._tempMatrix)
    }
    leftDoorInstanced.instanceMatrix.needsUpdate = true
    rightDoorInstanced.instanceMatrix.needsUpdate = true
    frameInstanced.instanceMatrix.needsUpdate = true
    elevatorGroup.add(leftDoorInstanced)
    elevatorGroup.add(rightDoorInstanced)
    elevatorGroup.add(frameInstanced)

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
    this._elevatorCars.push(elevatorCar)

    const cableCount = 2
    const cableGeo = new THREE.CylinderGeometry(0.02, 0.02, totalHeight, 4)
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.6,
      metalness: 0.7,
    })
    const cableInstanced = new THREE.InstancedMesh(cableGeo, cableMat, cableCount)
    cableInstanced.name = 'elevator_cables_instanced'

    const cablePositions = [
      [-shaftWidth / 4, 0],
      [shaftWidth / 4, 0],
    ]
    for (let i = 0; i < cableCount; i++) {
      const [cx, cz] = cablePositions[i]
      this._tempVector.set(position.x + cx, totalHeight / 2, position.z + cz)
      this._tempMatrix.compose(this._tempVector, this._tempQuaternion, new THREE.Vector3(1, 1, 1))
      cableInstanced.setMatrixAt(i, this._tempMatrix)
    }
    cableInstanced.instanceMatrix.needsUpdate = true
    elevatorGroup.add(cableInstanced)

    group.add(elevatorGroup)
  }

  _addFloorLabels(group, width, depth, floorCount, floorHeight, showLabels) {
    const labelGroup = new THREE.Group()
    labelGroup.name = 'floorLabels'

    if (!showLabels || floorCount === 0) {
      group.add(labelGroup)
      return
    }

    const labelGeo = new THREE.PlaneGeometry(1.2, 0.6)

    for (let i = 0; i < floorCount; i++) {
      const y = i * floorHeight + floorHeight / 2

      const canvas = document.createElement('canvas')
      canvas.width = 128
      canvas.height = 64
      const ctx = canvas.getContext('2d')

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

      const labelFront = new THREE.Mesh(labelGeo, labelMat)
      labelFront.position.set(0, y, depth / 2 - 0.05)
      labelFront.name = `floor_label_front_${i}`
      labelGroup.add(labelFront)

      const labelBack = new THREE.Mesh(labelGeo, labelMat)
      labelBack.position.set(0, y, -depth / 2 + 0.05)
      labelBack.rotation.y = Math.PI
      labelBack.name = `floor_label_back_${i}`
      labelGroup.add(labelBack)
    }

    group.add(labelGroup)
  }

  updateAnimation(delta, elapsed) {
    for (const elevatorCar of this._elevatorCars) {
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

  getFloorInfo(buildingId) {
    const floorGroup = this._floorGroups.get(buildingId)
    if (!floorGroup) return null

    const buildingGroup = floorGroup.parent
    const floors = buildingGroup.userData.floors
    const floorHeight = buildingGroup.userData.floorHeight || 3.5
    return {
      buildingId,
      floorCount: floors,
      floorHeight,
      totalHeight: floors * floorHeight,
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
    this._elevatorCars = []

    for (const key in this._materials) {
      if (this._materials[key]) {
        this._materials[key].dispose()
      }
    }
  }
}
