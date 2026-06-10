import * as THREE from 'three'

export class VehicleBuilder {
  constructor(scene) {
    this.scene = scene
    this.vehicleGroup = new THREE.Group()
    this.vehicleGroup.name = 'vehicles'
    this.scene.add(this.vehicleGroup)

    this.pedestrians = []
    this.cars = []

    this._pedestrianGeo = this._createPedestrianGeometry()
    this._carGeo = this._createCarGeometry()
  }

  buildFromConfig(config) {
    if (config.pedestrians) {
      for (const item of config.pedestrians) {
        this.createPedestrian(item)
      }
    }
    if (config.cars) {
      for (const item of config.cars) {
        this.createCar(item)
      }
    }
  }

  createPedestrian({ id, path, speed = 1, color = 0x334455, closed = false }) {
    const group = new THREE.Group()
    group.name = `pedestrian_${id}`
    group.userData = {
      interactive: true,
      vehicleId: id,
      category: 'pedestrian',
    }

    const bodyColor = new THREE.Color(color)
    const skinColors = [0xf5d0a9, 0xd4a574, 0x8d5524, 0xc68642, 0xe0ac69, 0xf1c27d]
    const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)]
    const hairColors = [0x1a1a1a, 0x3d2314, 0x5c3a21, 0x8b6914, 0x9a7b4f, 0xc0c0c0]
    const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)]
    const pantColors = [0x222244, 0x2f4f4f, 0x3d3d3d, 0x4a3728, 0x1a1a2e]
    const pantColor = pantColors[Math.floor(Math.random() * pantColors.length)]
    const shoeColors = [0x1a1a1a, 0x2d2d2d, 0x4a3728, 0x5c4033]
    const shoeColor = shoeColors[Math.floor(Math.random() * shoeColors.length)]

    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: bodyColor, 
      roughness: 0.65,
      metalness: 0.05,
    })
    const skinMat = new THREE.MeshPhysicalMaterial({ 
      color: skinColor, 
      roughness: 0.45,
      metalness: 0.0,
      clearcoat: 0.15,
      clearcoatRoughness: 0.6,
    })
    const hairMat = new THREE.MeshStandardMaterial({ 
      color: hairColor, 
      roughness: 0.85,
      metalness: 0.0,
    })
    const pantsMat = new THREE.MeshStandardMaterial({ 
      color: pantColor, 
      roughness: 0.75,
      metalness: 0.0,
    })
    const shoeMat = new THREE.MeshStandardMaterial({ 
      color: shoeColor, 
      roughness: 0.4,
      metalness: 0.1,
    })
    const eyeMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a2e, 
      roughness: 0.2,
      metalness: 0.3,
    })
    const mouthMat = new THREE.MeshStandardMaterial({ 
      color: 0x8b3a3a, 
      roughness: 0.5,
    })
    const noseMat = skinMat.clone()
    const buttonMat = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc, 
      roughness: 0.3,
      metalness: 0.6,
    })
    const collarMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      roughness: 0.6,
    })
    const beltMat = new THREE.MeshStandardMaterial({ 
      color: 0x3d2817, 
      roughness: 0.5,
      metalness: 0.1,
    })

    const torso = new THREE.Mesh(this._pedestrianGeo.torso, bodyMat)
    torso.position.y = 1.0
    torso.castShadow = true
    group.add(torso)

    const collar = new THREE.Mesh(this._pedestrianGeo.collar, collarMat)
    collar.position.y = 1.32
    collar.rotation.x = Math.PI / 2
    collar.castShadow = true
    group.add(collar)

    const belt = new THREE.Mesh(this._pedestrianGeo.belt, beltMat)
    belt.position.y = 0.75
    belt.castShadow = true
    group.add(belt)

    for (let i = 0; i < 3; i++) {
      const button = new THREE.Mesh(this._pedestrianGeo.button, buttonMat)
      button.position.set(0, 1.15 - i * 0.12, 0.115)
      button.rotation.x = Math.PI / 2
      button.castShadow = true
      group.add(button)
    }

    const head = new THREE.Mesh(this._pedestrianGeo.head, skinMat)
    head.position.y = 1.68
    head.castShadow = true
    group.add(head)

    const hair = new THREE.Mesh(this._pedestrianGeo.hair, hairMat)
    hair.position.y = 1.68
    hair.castShadow = true
    group.add(hair)

    const leftEye = new THREE.Mesh(this._pedestrianGeo.eye, eyeMat)
    leftEye.position.set(-0.045, 1.72, 0.13)
    group.add(leftEye)

    const rightEye = new THREE.Mesh(this._pedestrianGeo.eye, eyeMat)
    rightEye.position.set(0.045, 1.72, 0.13)
    group.add(rightEye)

    const nose = new THREE.Mesh(this._pedestrianGeo.nose, noseMat)
    nose.position.set(0, 1.66, 0.145)
    nose.rotation.x = Math.PI / 2
    group.add(nose)

    const mouth = new THREE.Mesh(this._pedestrianGeo.mouth, mouthMat)
    mouth.position.set(0, 1.6, 0.14)
    group.add(mouth)

    const leftLeg = new THREE.Mesh(this._pedestrianGeo.leg, pantsMat)
    leftLeg.position.set(-0.13, 0.4, 0)
    leftLeg.name = 'leftLeg'
    leftLeg.castShadow = true
    group.add(leftLeg)

    const rightLeg = new THREE.Mesh(this._pedestrianGeo.leg, pantsMat)
    rightLeg.position.set(0.13, 0.4, 0)
    rightLeg.name = 'rightLeg'
    rightLeg.castShadow = true
    group.add(rightLeg)

    const leftFoot = new THREE.Mesh(this._pedestrianGeo.foot, shoeMat)
    leftFoot.position.set(-0.13, 0.1, 0.04)
    leftFoot.name = 'leftFoot'
    leftFoot.castShadow = true
    group.add(leftFoot)

    const rightFoot = new THREE.Mesh(this._pedestrianGeo.foot, shoeMat)
    rightFoot.position.set(0.13, 0.1, 0.04)
    rightFoot.name = 'rightFoot'
    rightFoot.castShadow = true
    group.add(rightFoot)

    const leftArm = new THREE.Mesh(this._pedestrianGeo.arm, bodyMat)
    leftArm.position.set(-0.32, 1.08, 0)
    leftArm.name = 'leftArm'
    leftArm.castShadow = true
    group.add(leftArm)

    const rightArm = new THREE.Mesh(this._pedestrianGeo.arm, bodyMat)
    rightArm.position.set(0.32, 1.08, 0)
    rightArm.name = 'rightArm'
    rightArm.castShadow = true
    group.add(rightArm)

    const curve = new THREE.CatmullRomCurve3(
      path.map(p => new THREE.Vector3(p[0], 0, p[1])),
      closed
    )

    const pedData = {
      group,
      curve,
      speed,
      progress: Math.random(),
      direction: 1,
      closed,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      leftFoot,
      rightFoot,
      torso,
      walkPhase: Math.random() * Math.PI * 2,
      bobPhase: Math.random() * Math.PI * 2,
    }

    this.pedestrians.push(pedData)
    this.vehicleGroup.add(group)
    return group
  }

  createCar({ id, path, speed = 1.5, color = 0xcc3333, type = 'sedan', closed = false }) {
    const group = new THREE.Group()
    group.name = `car_${id}`
    group.userData = {
      interactive: true,
      vehicleId: id,
      category: 'car',
      carType: type,
    }

    const bodyMat = new THREE.MeshPhysicalMaterial({ 
      color, 
      roughness: 0.2, 
      metalness: 0.8,
      clearcoat: 0.5,
      clearcoatRoughness: 0.15,
    })
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xaaddff,
      roughness: 0.02,
      metalness: 0.0,
      transmission: 0.85,
      transparent: true,
      opacity: 0.4,
      reflectivity: 0.9,
      ior: 1.5,
      thickness: 0.02,
    })
    const tireMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a, 
      roughness: 0.9, 
      metalness: 0.0,
    })
    const rimMat = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc, 
      roughness: 0.2, 
      metalness: 0.9,
    })
    const hubMat = new THREE.MeshStandardMaterial({ 
      color: 0x888888, 
      roughness: 0.3, 
      metalness: 0.7,
    })
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xffffee,
      emissive: 0xffffaa,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.1,
    })
    const tailLightMat = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.1,
    })
    const bumperMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.6,
      metalness: 0.1,
    })
    const mirrorMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.25,
      metalness: 0.7,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
    })
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.25,
      metalness: 0.8,
    })

    if (type === 'sedan') {
      this._buildSedan(group, bodyMat, glassMat, tireMat, rimMat, hubMat, lightMat, tailLightMat, bumperMat, mirrorMat, handleMat)
    } else if (type === 'suv') {
      this._buildSuv(group, bodyMat, glassMat, tireMat, rimMat, hubMat, lightMat, tailLightMat, bumperMat, mirrorMat, handleMat)
    } else if (type === 'van') {
      this._buildVan(group, bodyMat, glassMat, tireMat, rimMat, hubMat, lightMat, tailLightMat, bumperMat, mirrorMat, handleMat)
    }

    const curve = new THREE.CatmullRomCurve3(
      path.map(p => new THREE.Vector3(p[0], 0, p[1])),
      closed
    )

    const carData = {
      group,
      curve,
      speed,
      progress: Math.random(),
      direction: 1,
      closed,
    }

    this.cars.push(carData)
    this.vehicleGroup.add(group)
    return group
  }

  _buildSedan(group, bodyMat, glassMat, tireMat, rimMat, hubMat, lightMat, tailLightMat, bumperMat, mirrorMat, handleMat) {
    const body = new THREE.Mesh(this._carGeo.sedanBody, bodyMat)
    body.position.y = 0.5
    body.castShadow = true
    body.renderOrder = 1
    group.add(body)

    const cabin = new THREE.Mesh(this._carGeo.sedanCabin, glassMat)
    cabin.position.set(0, 1.0, 0.2)
    cabin.renderOrder = 2
    group.add(cabin)

    this._addWheels(group, tireMat, rimMat, hubMat, 0.35, [
      [-0.7, 0.35, 1.05],
      [0.7, 0.35, 1.05],
      [-0.7, 0.35, -1.05],
      [0.7, 0.35, -1.05],
    ])

    this._addLights(group, lightMat, tailLightMat, 0.55, 1.5)

    this._addBumpers(group, bumperMat, 0.2, 1.55)

    this._addSideMirrors(group, mirrorMat, 0.9, 0.85)

    this._addDoorHandles(group, handleMat, 0.75, 0.6, 0.5)

    this._addInterior(group, 0.55, 0.6, 0.4, 2)

    this._addUnderbody(group, 0.18, 1.4, 2.8)

    this._addWheelWells(group, 0.25, 1.05, -1.05, 0.08)
  }

  _buildSuv(group, bodyMat, glassMat, tireMat, rimMat, hubMat, lightMat, tailLightMat, bumperMat, mirrorMat, handleMat) {
    const body = new THREE.Mesh(this._carGeo.suvBody, bodyMat)
    body.position.y = 0.65
    body.castShadow = true
    body.renderOrder = 1
    group.add(body)

    const cabin = new THREE.Mesh(this._carGeo.suvCabin, glassMat)
    cabin.position.set(0, 1.2, 0)
    cabin.renderOrder = 2
    group.add(cabin)

    this._addWheels(group, tireMat, rimMat, hubMat, 0.4, [
      [-0.8, 0.4, 1.15],
      [0.8, 0.4, 1.15],
      [-0.8, 0.4, -1.15],
      [0.8, 0.4, -1.15],
    ])

    this._addLights(group, lightMat, tailLightMat, 0.7, 1.7)

    this._addBumpers(group, bumperMat, 0.25, 1.75)

    this._addSideMirrors(group, mirrorMat, 1.05, 1.0)

    this._addDoorHandles(group, handleMat, 0.9, 0.75, 0.6)

    this._addInterior(group, 0.65, 0.7, 0.4, 3)

    this._addUnderbody(group, 0.22, 1.5, 3.2)

    this._addWheelWells(group, 0.3, 1.15, -1.15, 0.08)
  }

  _buildVan(group, bodyMat, glassMat, tireMat, rimMat, hubMat, lightMat, tailLightMat, bumperMat, mirrorMat, handleMat) {
    const body = new THREE.Mesh(this._carGeo.vanBody, bodyMat)
    body.position.y = 0.85
    body.castShadow = true
    body.renderOrder = 1
    group.add(body)

    const cabin = new THREE.Mesh(this._carGeo.vanCabin, glassMat)
    cabin.position.set(0, 1.45, 1.2)
    cabin.renderOrder = 2
    group.add(cabin)

    this._addWheels(group, tireMat, rimMat, hubMat, 0.4, [
      [-0.85, 0.4, 1.35],
      [0.85, 0.4, 1.35],
      [-0.85, 0.4, -1.35],
      [0.85, 0.4, -1.35],
    ])

    this._addLights(group, lightMat, tailLightMat, 0.9, 1.9)

    this._addBumpers(group, bumperMat, 0.3, 1.95)

    this._addSideMirrors(group, mirrorMat, 1.25, 1.3)

    this._addDoorHandles(group, handleMat, 1.0, 0.9, 0.8)

    this._addInterior(group, 0.85, 0.95, 0.4, 2)

    this._addUnderbody(group, 0.28, 1.6, 3.6)

    this._addWheelWells(group, 0.3, 1.35, -1.35, 0.08)
  }

  _addWheels(group, tireMat, rimMat, hubMat, radius, positions) {
    const tireScale = radius
    const halfTire = 0.11
    const halfRim = 0.12
    const halfHub = 0.13
    for (const pos of positions) {
      const wheelGroup = new THREE.Group()

      const tire = new THREE.Mesh(this._carGeo.wheelTire, tireMat)
      tire.scale.set(tireScale, 1, tireScale)
      tire.rotation.z = Math.PI / 2
      tire.castShadow = true
      wheelGroup.add(tire)

      const tireSideL = new THREE.Mesh(this._carGeo.wheelTireSide, tireMat)
      tireSideL.scale.set(tireScale, tireScale, 1)
      tireSideL.position.y = halfTire
      tireSideL.rotation.x = -Math.PI / 2
      wheelGroup.add(tireSideL)

      const tireSideR = new THREE.Mesh(this._carGeo.wheelTireSide, tireMat)
      tireSideR.scale.set(tireScale, tireScale, 1)
      tireSideR.position.y = -halfTire
      tireSideR.rotation.x = Math.PI / 2
      wheelGroup.add(tireSideR)

      const rim = new THREE.Mesh(this._carGeo.wheelRim, rimMat)
      rim.scale.set(tireScale * 0.55, 1, tireScale * 0.55)
      rim.rotation.z = Math.PI / 2
      wheelGroup.add(rim)

      const rimSideL = new THREE.Mesh(this._carGeo.wheelRimSide, rimMat)
      rimSideL.scale.set(tireScale * 0.55, tireScale * 0.55, 1)
      rimSideL.position.y = halfRim
      rimSideL.rotation.x = -Math.PI / 2
      wheelGroup.add(rimSideL)

      const rimSideR = new THREE.Mesh(this._carGeo.wheelRimSide, rimMat)
      rimSideR.scale.set(tireScale * 0.55, tireScale * 0.55, 1)
      rimSideR.position.y = -halfRim
      rimSideR.rotation.x = Math.PI / 2
      wheelGroup.add(rimSideR)

      const hubCap = new THREE.Mesh(this._carGeo.wheelHubCap, hubMat)
      hubCap.scale.set(tireScale * 0.2, 1, tireScale * 0.2)
      hubCap.rotation.z = Math.PI / 2
      wheelGroup.add(hubCap)

      const hubSideL = new THREE.Mesh(this._carGeo.wheelHubCapSide, hubMat)
      hubSideL.scale.set(tireScale * 0.2, tireScale * 0.2, 1)
      hubSideL.position.y = halfHub
      hubSideL.rotation.x = -Math.PI / 2
      wheelGroup.add(hubSideL)

      const hubSideR = new THREE.Mesh(this._carGeo.wheelHubCapSide, hubMat)
      hubSideR.scale.set(tireScale * 0.2, tireScale * 0.2, 1)
      hubSideR.position.y = -halfHub
      hubSideR.rotation.x = Math.PI / 2
      wheelGroup.add(hubSideR)

      wheelGroup.position.set(pos[0], pos[1], pos[2])
      group.add(wheelGroup)
    }
  }

  _addLights(group, lightMat, tailLightMat, yPos, halfLength) {
    const frontLeft = new THREE.Mesh(this._carGeo.headlight, lightMat)
    frontLeft.position.set(-0.5, yPos, halfLength)
    frontLeft.rotation.x = -Math.PI / 2
    group.add(frontLeft)

    const frontRight = new THREE.Mesh(this._carGeo.headlight, lightMat)
    frontRight.position.set(0.5, yPos, halfLength)
    frontRight.rotation.x = -Math.PI / 2
    group.add(frontRight)

    const tailLeft = new THREE.Mesh(this._carGeo.taillight, tailLightMat)
    tailLeft.position.set(-0.5, yPos, -halfLength)
    group.add(tailLeft)

    const tailRight = new THREE.Mesh(this._carGeo.taillight, tailLightMat)
    tailRight.position.set(0.5, yPos, -halfLength)
    group.add(tailRight)
  }

  _addBumpers(group, bumperMat, yPos, halfLength) {
    const frontBumper = new THREE.Mesh(this._carGeo.bumper, bumperMat)
    frontBumper.position.set(0, yPos, halfLength + 0.05)
    frontBumper.castShadow = true
    group.add(frontBumper)

    const rearBumper = new THREE.Mesh(this._carGeo.bumper, bumperMat)
    rearBumper.position.set(0, yPos, -halfLength - 0.05)
    rearBumper.castShadow = true
    group.add(rearBumper)
  }

  _addSideMirrors(group, mirrorMat, yPos, zPos) {
    const leftMirror = new THREE.Mesh(this._carGeo.sideMirror, mirrorMat)
    leftMirror.position.set(-0.85, yPos, zPos)
    leftMirror.castShadow = true
    group.add(leftMirror)

    const rightMirror = new THREE.Mesh(this._carGeo.sideMirror, mirrorMat)
    rightMirror.position.set(0.85, yPos, zPos)
    rightMirror.castShadow = true
    group.add(rightMirror)
  }

  _addDoorHandles(group, handleMat, yPos, zFront, zRear) {
    const leftFrontHandle = new THREE.Mesh(this._carGeo.doorHandle, handleMat)
    leftFrontHandle.position.set(-0.76, yPos, zFront)
    group.add(leftFrontHandle)

    const leftRearHandle = new THREE.Mesh(this._carGeo.doorHandle, handleMat)
    leftRearHandle.position.set(-0.76, yPos, -zRear)
    group.add(leftRearHandle)

    const rightFrontHandle = new THREE.Mesh(this._carGeo.doorHandle, handleMat)
    rightFrontHandle.position.set(0.76, yPos, zFront)
    group.add(rightFrontHandle)

    const rightRearHandle = new THREE.Mesh(this._carGeo.doorHandle, handleMat)
    rightRearHandle.position.set(0.76, yPos, -zRear)
    group.add(rightRearHandle)
  }

  _addInterior(group, floorY, seatY, seatSpacing, rearSeatCount) {
    const interiorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.0,
    })
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      roughness: 0.7,
      metalness: 0.0,
    })
    const steeringMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.5,
      metalness: 0.1,
    })
    const dashMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.6,
      metalness: 0.1,
    })
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.5,
      metalness: 0.0,
    })

    const driverSeat = new THREE.Mesh(this._carGeo.seat, seatMat)
    driverSeat.position.set(-0.25, seatY, 0.3)
    group.add(driverSeat)

    const driverSeatBack = new THREE.Mesh(this._carGeo.seatBack, seatMat)
    driverSeatBack.position.set(-0.25, seatY + 0.25, 0.1)
    group.add(driverSeatBack)

    const passengerSeat = new THREE.Mesh(this._carGeo.seat, seatMat)
    passengerSeat.position.set(0.25, seatY, 0.3)
    group.add(passengerSeat)

    const passengerSeatBack = new THREE.Mesh(this._carGeo.seatBack, seatMat)
    passengerSeatBack.position.set(0.25, seatY + 0.25, 0.1)
    group.add(passengerSeatBack)

    for (let i = 0; i < rearSeatCount; i++) {
      const rearSeat = new THREE.Mesh(this._carGeo.seat, seatMat)
      rearSeat.position.set(-0.25 + i * seatSpacing, seatY, -0.6)
      rearSeat.scale.z = 0.8
      group.add(rearSeat)

      const rearSeatBack = new THREE.Mesh(this._carGeo.seatBack, seatMat)
      rearSeatBack.position.set(-0.25 + i * seatSpacing, seatY + 0.25, -0.8)
      group.add(rearSeatBack)
    }

    const steeringWheel = new THREE.Mesh(this._carGeo.steeringWheel, steeringMat)
    steeringWheel.position.set(-0.28, seatY + 0.35, 0.55)
    steeringWheel.rotation.x = -Math.PI / 4
    group.add(steeringWheel)

    const dashboard = new THREE.Mesh(this._carGeo.dashboard, dashMat)
    dashboard.position.set(0, seatY + 0.15, 0.7)
    group.add(dashboard)

    const rearPlate = new THREE.Mesh(this._carGeo.licensePlate, plateMat)
    rearPlate.position.set(0, floorY + 0.08, -1.52)
    group.add(rearPlate)
  }

  _addUnderbody(group, yPos, width, length) {
    const underbodyMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
      metalness: 0.0,
    })
    const underbody = new THREE.Mesh(this._carGeo.underbody, underbodyMat)
    underbody.scale.set(width / 1.3, 1, length / 3.0)
    underbody.position.set(0, yPos, 0)
    group.add(underbody)
  }

  _addWheelWells(group, wellY, frontZ, rearZ, width) {
    const wellMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })

    const frontWellL = new THREE.Mesh(this._carGeo.wheelWellFront, wellMat)
    frontWellL.position.set(-width, wellY, frontZ)
    frontWellL.rotation.y = -Math.PI / 2
    group.add(frontWellL)

    const frontWellR = new THREE.Mesh(this._carGeo.wheelWellFront, wellMat)
    frontWellR.position.set(width, wellY, frontZ)
    frontWellR.rotation.y = Math.PI / 2
    group.add(frontWellR)

    const rearWellL = new THREE.Mesh(this._carGeo.wheelWellRear, wellMat)
    rearWellL.position.set(-width, wellY, rearZ)
    rearWellL.rotation.y = -Math.PI / 2
    group.add(rearWellL)

    const rearWellR = new THREE.Mesh(this._carGeo.wheelWellRear, wellMat)
    rearWellR.position.set(width, wellY, rearZ)
    rearWellR.rotation.y = Math.PI / 2
    group.add(rearWellR)
  }

  _createPedestrianGeometry() {
    const headGeo = new THREE.SphereGeometry(0.15, 24, 18)
    const torsoGeo = new THREE.BoxGeometry(0.38, 0.55, 0.22, 4, 4, 2)
    const legGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.6, 12)
    const armGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.5, 10)
    const footGeo = new THREE.BoxGeometry(0.1, 0.06, 0.18)
    
    const eyeGeo = new THREE.SphereGeometry(0.018, 8, 6)
    const mouthGeo = new THREE.BoxGeometry(0.04, 0.008, 0.01)
    const noseGeo = new THREE.ConeGeometry(0.015, 0.025, 6)
    
    const collarGeo = new THREE.TorusGeometry(0.12, 0.025, 8, 16)
    const beltGeo = new THREE.BoxGeometry(0.4, 0.04, 0.04)
    const buttonGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 8)
    
    const hairGeo = new THREE.SphereGeometry(0.155, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2)
    
    return {
      head: headGeo,
      torso: torsoGeo,
      leg: legGeo,
      arm: armGeo,
      foot: footGeo,
      eye: eyeGeo,
      mouth: mouthGeo,
      nose: noseGeo,
      collar: collarGeo,
      belt: beltGeo,
      button: buttonGeo,
      hair: hairGeo,
    }
  }

  _createCarGeometry() {
    const sedanBody = (() => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.7, 0)
      shape.lineTo(-0.7, 0.25)
      shape.quadraticCurveTo(-0.7, 0.5, -0.5, 0.55)
      shape.lineTo(0.5, 0.55)
      shape.quadraticCurveTo(0.7, 0.5, 0.7, 0.25)
      shape.lineTo(0.7, 0)
      shape.lineTo(-0.7, 0)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 3.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 4 })
      geo.translate(0, 0, -1.6)
      return geo
    })()

    const sedanCabin = (() => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.55, 0)
      shape.lineTo(-0.45, 0.35)
      shape.quadraticCurveTo(0, 0.5, 0.45, 0.35)
      shape.lineTo(0.55, 0)
      shape.lineTo(-0.55, 0)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.5, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 })
      geo.translate(0, 0, -0.75)
      return geo
    })()

    const suvBody = (() => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.8, 0)
      shape.lineTo(-0.8, 0.35)
      shape.quadraticCurveTo(-0.8, 0.65, -0.6, 0.7)
      shape.lineTo(0.6, 0.7)
      shape.quadraticCurveTo(0.8, 0.65, 0.8, 0.35)
      shape.lineTo(0.8, 0)
      shape.lineTo(-0.8, 0)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 3.6, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 4 })
      geo.translate(0, 0, -1.8)
      return geo
    })()

    const suvCabin = (() => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.65, 0)
      shape.lineTo(-0.6, 0.55)
      shape.quadraticCurveTo(0, 0.65, 0.6, 0.55)
      shape.lineTo(0.65, 0)
      shape.lineTo(-0.65, 0)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 2.0, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 })
      geo.translate(0, 0, -1.0)
      return geo
    })()

    const vanBody = (() => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.9, 0)
      shape.lineTo(-0.9, 0.5)
      shape.quadraticCurveTo(-0.9, 0.9, -0.7, 0.95)
      shape.lineTo(0.7, 0.95)
      shape.quadraticCurveTo(0.9, 0.9, 0.9, 0.5)
      shape.lineTo(0.9, 0)
      shape.lineTo(-0.9, 0)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 4.0, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 4 })
      geo.translate(0, 0, -2.0)
      return geo
    })()

    const vanCabin = (() => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.75, 0)
      shape.lineTo(-0.7, 0.6)
      shape.quadraticCurveTo(0, 0.7, 0.7, 0.6)
      shape.lineTo(0.75, 0)
      shape.lineTo(-0.75, 0)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 })
      geo.translate(0, 0, -0.65)
      return geo
    })()

    const wheelTire = (() => {
      const geo = new THREE.CylinderGeometry(1, 1, 0.22, 32, 1, false)
      return geo
    })()

    const wheelTireSide = (() => {
      const geo = new THREE.CircleGeometry(1, 32)
      return geo
    })()

    const wheelRim = (() => {
      const geo = new THREE.CylinderGeometry(0.55, 0.55, 0.24, 16, 1, false)
      return geo
    })()

    const wheelRimSide = (() => {
      const geo = new THREE.CircleGeometry(0.55, 16)
      return geo
    })()

    const wheelHubCap = (() => {
      const geo = new THREE.CylinderGeometry(0.2, 0.2, 0.26, 8, 1, false)
      return geo
    })()

    const wheelHubCapSide = (() => {
      const geo = new THREE.CircleGeometry(0.2, 8)
      return geo
    })()

    const headlight = (() => {
      const geo = new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
      geo.scale(1.2, 0.6, 1)
      return geo
    })()

    const taillight = new THREE.BoxGeometry(0.25, 0.1, 0.08)
    const bumper = new THREE.BoxGeometry(1.5, 0.12, 0.15)
    const sideMirror = new THREE.SphereGeometry(0.08, 8, 6)
    const doorHandle = new THREE.BoxGeometry(0.08, 0.03, 0.02)

    const underbody = new THREE.BoxGeometry(1.3, 0.05, 3.0)

    const seat = (() => {
      const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4, 1, 1, 1)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const z = pos.getZ(i)
        if (y > 0) {
          pos.setX(i, x * 0.9)
          pos.setZ(i, z * 0.7)
        }
        if (z > 0 && y > -0.1) {
          pos.setY(i, y + 0.15)
        }
      }
      geo.computeVertexNormals()
      return geo
    })()

    const seatBack = new THREE.BoxGeometry(0.38, 0.35, 0.08)
    const steeringWheel = new THREE.TorusGeometry(0.12, 0.015, 8, 16)
    const dashboard = new THREE.BoxGeometry(1.1, 0.2, 0.3)

    const wheelWellFront = (() => {
      const shape = new THREE.Shape()
      shape.absarc(0, 0, 0.5, 0, Math.PI, false)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false })
      geo.translate(0, 0, -0.05)
      return geo
    })()

    const wheelWellRear = (() => {
      const shape = new THREE.Shape()
      shape.absarc(0, 0, 0.5, 0, Math.PI, false)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false })
      geo.translate(0, 0, -0.05)
      return geo
    })()

    const exhaust = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8)

    const licensePlate = new THREE.BoxGeometry(0.4, 0.12, 0.02)

    return {
      sedanBody,
      sedanCabin,
      suvBody,
      suvCabin,
      vanBody,
      vanCabin,
      wheelTire,
      wheelTireSide,
      wheelRim,
      wheelRimSide,
      wheelHubCap,
      wheelHubCapSide,
      headlight,
      taillight,
      bumper,
      sideMirror,
      doorHandle,
      underbody,
      seat,
      seatBack,
      steeringWheel,
      dashboard,
      wheelWellFront,
      wheelWellRear,
      exhaust,
      licensePlate,
    }
  }

  updateAnimation(delta, elapsed) {
    const clampedDelta = Math.min(delta, 0.05)

    for (const ped of this.pedestrians) {
      ped.progress += clampedDelta * ped.speed * 0.03 * ped.direction

      if (ped.closed) {
        if (ped.progress >= 1) ped.progress -= 1
        if (ped.progress < 0) ped.progress += 1
      } else {
        if (ped.progress >= 1) {
          ped.progress = 1
          ped.direction = -1
        } else if (ped.progress <= 0) {
          ped.progress = 0
          ped.direction = 1
        }
      }

      const t = Math.max(0.002, Math.min(0.998, ped.progress))
      const point = ped.curve.getPointAt(t)
      const tangent = ped.curve.getTangentAt(t)

      ped.group.position.copy(point)
      ped.group.position.y = 0.15

      const targetAngle = ped.direction === 1
        ? Math.atan2(tangent.x, tangent.z)
        : Math.atan2(tangent.x, tangent.z) + Math.PI
      ped.group.rotation.y = this._lerpAngle(ped.group.rotation.y, targetAngle, Math.min(1, clampedDelta * 8))

      ped.walkPhase += clampedDelta * ped.speed * 8
      ped.bobPhase += clampedDelta * ped.speed * 8

      const legSwing = Math.sin(ped.walkPhase) * 0.5
      const armSwing = Math.sin(ped.walkPhase + Math.PI) * 0.4
      const bodyBob = Math.abs(Math.sin(ped.walkPhase)) * 0.03
      const hipSway = Math.sin(ped.walkPhase * 2) * 0.02
      const shoulderSway = Math.sin(ped.walkPhase * 2 + Math.PI) * 0.015

      if (ped.leftLeg) {
        ped.leftLeg.rotation.x = legSwing
        ped.leftLeg.position.z = hipSway * 0.5
      }
      if (ped.rightLeg) {
        ped.rightLeg.rotation.x = -legSwing
        ped.rightLeg.position.z = -hipSway * 0.5
      }
      if (ped.leftArm) {
        ped.leftArm.rotation.x = armSwing
        ped.leftArm.position.z = shoulderSway
      }
      if (ped.rightArm) {
        ped.rightArm.rotation.x = -armSwing
        ped.rightArm.position.z = -shoulderSway
      }
      if (ped.leftFoot) {
        const footLift = Math.max(0, Math.sin(ped.walkPhase + Math.PI / 2)) * 0.08
        ped.leftFoot.position.y = 0.1 + footLift
        ped.leftFoot.rotation.x = legSwing * 0.3
      }
      if (ped.rightFoot) {
        const footLift = Math.max(0, Math.sin(ped.walkPhase - Math.PI / 2)) * 0.08
        ped.rightFoot.position.y = 0.1 + footLift
        ped.rightFoot.rotation.x = -legSwing * 0.3
      }
      if (ped.torso) {
        ped.torso.position.y = 1.0 + bodyBob
        ped.torso.rotation.z = hipSway * 0.3
      }
    }

    for (const car of this.cars) {
      car.progress += clampedDelta * car.speed * 0.015 * car.direction

      if (car.closed) {
        if (car.progress >= 1) car.progress -= 1
        if (car.progress < 0) car.progress += 1
      } else {
        if (car.progress >= 1) {
          car.progress = 1
          car.direction = -1
        } else if (car.progress <= 0) {
          car.progress = 0
          car.direction = 1
        }
      }

      const t = Math.max(0.002, Math.min(0.998, car.progress))
      const point = car.curve.getPointAt(t)
      const tangent = car.curve.getTangentAt(t)

      const smoothFactor = Math.min(1, clampedDelta * 10)
      car.group.position.x += (point.x - car.group.position.x) * smoothFactor
      car.group.position.y = 0.1
      car.group.position.z += (point.z - car.group.position.z) * smoothFactor

      const targetAngle = Math.atan2(tangent.x, tangent.z)
      car.group.rotation.y = this._lerpAngle(car.group.rotation.y, targetAngle, Math.min(1, clampedDelta * 6))
    }

    this._checkCarDistances()
  }

  _lerpAngle(current, target, factor) {
    let diff = target - current
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    return current + diff * factor
  }

  _checkCarDistances() {
    for (let i = 0; i < this.cars.length; i++) {
      for (let j = i + 1; j < this.cars.length; j++) {
        const posA = this.cars[i].group.position
        const posB = this.cars[j].group.position
        const dist = posA.distanceTo(posB)
        if (dist < 4) {
          const adjustment = 0.005 * this.cars[j].direction
          this.cars[j].progress += adjustment
          if (this.cars[j].closed) {
            if (this.cars[j].progress >= 1) this.cars[j].progress -= 1
            if (this.cars[j].progress < 0) this.cars[j].progress += 1
          }
        }
      }
    }
  }

  dispose() {
    Object.values(this._pedestrianGeo).forEach(g => g.dispose())
    Object.values(this._carGeo).forEach(g => g.dispose())

    this.vehicleGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
        else child.material.dispose()
      }
    })
    this.scene.remove(this.vehicleGroup)
  }
}
