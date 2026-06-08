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

  createPedestrian({ id, path, speed = 1, color = 0x334455 }) {
    const group = new THREE.Group()
    group.name = `pedestrian_${id}`
    group.userData = {
      interactive: true,
      vehicleId: id,
      category: 'pedestrian',
    }

    const bodyColor = new THREE.Color(color)
    const skinColors = [0xf5d0a9, 0xd4a574, 0x8d5524, 0xc68642]
    const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)]

    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7 })
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 })
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x222244, roughness: 0.8 })

    const torso = new THREE.Mesh(this._pedestrianGeo.torso, bodyMat)
    torso.position.y = 1.0
    torso.castShadow = true
    group.add(torso)

    const head = new THREE.Mesh(this._pedestrianGeo.head, skinMat)
    head.position.y = 1.65
    head.castShadow = true
    group.add(head)

    const leftLeg = new THREE.Mesh(this._pedestrianGeo.leg, pantsMat)
    leftLeg.position.set(-0.12, 0.4, 0)
    leftLeg.name = 'leftLeg'
    leftLeg.castShadow = true
    group.add(leftLeg)

    const rightLeg = new THREE.Mesh(this._pedestrianGeo.leg, pantsMat)
    rightLeg.position.set(0.12, 0.4, 0)
    rightLeg.name = 'rightLeg'
    rightLeg.castShadow = true
    group.add(rightLeg)

    const leftArm = new THREE.Mesh(this._pedestrianGeo.arm, bodyMat)
    leftArm.position.set(-0.32, 1.05, 0)
    leftArm.name = 'leftArm'
    leftArm.castShadow = true
    group.add(leftArm)

    const rightArm = new THREE.Mesh(this._pedestrianGeo.arm, bodyMat)
    rightArm.position.set(0.32, 1.05, 0)
    rightArm.name = 'rightArm'
    rightArm.castShadow = true
    group.add(rightArm)

    const curve = new THREE.CatmullRomCurve3(
      path.map(p => new THREE.Vector3(p[0], 0, p[1])),
      false
    )

    const pedData = {
      group,
      curve,
      speed,
      progress: Math.random(),
      direction: 1,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      walkPhase: Math.random() * Math.PI * 2,
    }

    this.pedestrians.push(pedData)
    this.vehicleGroup.add(group)
    return group
  }

  createCar({ id, path, speed = 1.5, color = 0xcc3333, type = 'sedan' }) {
    const group = new THREE.Group()
    group.name = `car_${id}`
    group.userData = {
      interactive: true,
      vehicleId: id,
      category: 'car',
      carType: type,
    }

    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.7 })
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88bbff,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.5,
      transparent: true,
      opacity: 0.6,
    })
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.3 })
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffff66,
      emissiveIntensity: 0.5,
    })
    const tailLightMat = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0xff0000,
      emissiveIntensity: 0.3,
    })

    if (type === 'sedan') {
      this._buildSedan(group, bodyMat, glassMat, wheelMat, lightMat, tailLightMat)
    } else if (type === 'suv') {
      this._buildSuv(group, bodyMat, glassMat, wheelMat, lightMat, tailLightMat)
    } else if (type === 'van') {
      this._buildVan(group, bodyMat, glassMat, wheelMat, lightMat, tailLightMat)
    }

    const curve = new THREE.CatmullRomCurve3(
      path.map(p => new THREE.Vector3(p[0], 0, p[1])),
      false
    )

    const carData = {
      group,
      curve,
      speed,
      progress: Math.random(),
      direction: 1,
    }

    this.cars.push(carData)
    this.vehicleGroup.add(group)
    return group
  }

  _buildSedan(group, bodyMat, glassMat, wheelMat, lightMat, tailLightMat) {
    const body = new THREE.Mesh(this._carGeo.sedanBody, bodyMat)
    body.position.y = 0.5
    body.castShadow = true
    group.add(body)

    const cabin = new THREE.Mesh(this._carGeo.sedanCabin, glassMat)
    cabin.position.y = 1.0
    group.add(cabin)

    this._addWheels(group, wheelMat, 0.35, [
      [-0.8, 0.35, 0.65],
      [0.8, 0.35, 0.65],
      [-0.8, 0.35, -0.65],
      [0.8, 0.35, -0.65],
    ])

    this._addLights(group, lightMat, tailLightMat, 0.55, 1.6)
  }

  _buildSuv(group, bodyMat, glassMat, wheelMat, lightMat, tailLightMat) {
    const body = new THREE.Mesh(this._carGeo.suvBody, bodyMat)
    body.position.y = 0.65
    body.castShadow = true
    group.add(body)

    const cabin = new THREE.Mesh(this._carGeo.suvCabin, glassMat)
    cabin.position.y = 1.2
    group.add(cabin)

    this._addWheels(group, wheelMat, 0.4, [
      [-0.9, 0.4, 0.75],
      [0.9, 0.4, 0.75],
      [-0.9, 0.4, -0.75],
      [0.9, 0.4, -0.75],
    ])

    this._addLights(group, lightMat, tailLightMat, 0.7, 1.8)
  }

  _buildVan(group, bodyMat, glassMat, wheelMat, lightMat, tailLightMat) {
    const body = new THREE.Mesh(this._carGeo.vanBody, bodyMat)
    body.position.y = 0.85
    body.castShadow = true
    group.add(body)

    const cabin = new THREE.Mesh(this._carGeo.vanCabin, glassMat)
    cabin.position.y = 1.45
    group.add(cabin)

    this._addWheels(group, wheelMat, 0.4, [
      [-1.0, 0.4, 0.8],
      [1.0, 0.4, 0.8],
      [-1.0, 0.4, -0.8],
      [1.0, 0.4, -0.8],
    ])

    this._addLights(group, lightMat, tailLightMat, 0.9, 2.0)
  }

  _addWheels(group, wheelMat, radius, positions) {
    const wheelGeo = new THREE.CylinderGeometry(radius, radius, 0.2, 12)
    for (const pos of positions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.position.set(pos[0], pos[1], pos[2])
      wheel.rotation.x = Math.PI / 2
      wheel.castShadow = true
      group.add(wheel)
    }
  }

  _addLights(group, lightMat, tailLightMat, yPos, halfLength) {
    const lightGeo = new THREE.BoxGeometry(0.1, 0.15, 0.3)
    const frontLeft = new THREE.Mesh(lightGeo, lightMat)
    frontLeft.position.set(-halfLength, yPos, 0.5)
    group.add(frontLeft)

    const frontRight = new THREE.Mesh(lightGeo, lightMat)
    frontRight.position.set(-halfLength, yPos, -0.5)
    group.add(frontRight)

    const tailGeo = new THREE.BoxGeometry(0.1, 0.12, 0.25)
    const tailLeft = new THREE.Mesh(tailGeo, tailLightMat)
    tailLeft.position.set(halfLength, yPos, 0.5)
    group.add(tailLeft)

    const tailRight = new THREE.Mesh(tailGeo, tailLightMat)
    tailRight.position.set(halfLength, yPos, -0.5)
    group.add(tailRight)
  }

  _createPedestrianGeometry() {
    return {
      torso: new THREE.BoxGeometry(0.35, 0.5, 0.2),
      head: new THREE.SphereGeometry(0.14, 8, 6),
      leg: new THREE.BoxGeometry(0.12, 0.6, 0.12),
      arm: new THREE.BoxGeometry(0.1, 0.5, 0.1),
    }
  }

  _createCarGeometry() {
    return {
      sedanBody: new THREE.BoxGeometry(3.2, 0.6, 1.4),
      sedanCabin: new THREE.BoxGeometry(1.6, 0.5, 1.3),
      suvBody: new THREE.BoxGeometry(3.6, 0.8, 1.6),
      suvCabin: new THREE.BoxGeometry(2.0, 0.6, 1.5),
      vanBody: new THREE.BoxGeometry(4.0, 1.0, 1.8),
      vanCabin: new THREE.BoxGeometry(1.2, 0.6, 1.7),
    }
  }

  updateAnimation(delta, elapsed) {
    for (const ped of this.pedestrians) {
      ped.progress += delta * ped.speed * 0.03 * ped.direction

      if (ped.progress >= 1) {
        ped.progress = 1
        ped.direction = -1
      } else if (ped.progress <= 0) {
        ped.progress = 0
        ped.direction = 1
      }

      const point = ped.curve.getPointAt(Math.max(0.001, Math.min(0.999, ped.progress)))
      const tangent = ped.curve.getTangentAt(Math.max(0.001, Math.min(0.999, ped.progress)))

      ped.group.position.copy(point)
      ped.group.position.y = 0

      const angle = Math.atan2(tangent.x, tangent.z)
      ped.group.rotation.y = ped.direction === 1 ? angle : angle + Math.PI

      ped.walkPhase += delta * ped.speed * 8
      const swing = Math.sin(ped.walkPhase) * 0.4

      if (ped.leftLeg) ped.leftLeg.rotation.x = swing
      if (ped.rightLeg) ped.rightLeg.rotation.x = -swing
      if (ped.leftArm) ped.leftArm.rotation.x = -swing * 0.6
      if (ped.rightArm) ped.rightArm.rotation.x = swing * 0.6
    }

    for (const car of this.cars) {
      car.progress += delta * car.speed * 0.02 * car.direction

      if (car.progress >= 1) {
        car.progress = 1
        car.direction = -1
      } else if (car.progress <= 0) {
        car.progress = 0
        car.direction = 1
      }

      const t = Math.max(0.001, Math.min(0.999, car.progress))
      const point = car.curve.getPointAt(t)
      const tangent = car.curve.getTangentAt(t)

      car.group.position.copy(point)
      car.group.position.y = 0

      const angle = Math.atan2(tangent.x, tangent.z)
      car.group.rotation.y = car.direction === 1 ? angle : angle + Math.PI
    }
  }

  dispose() {
    this._pedestrianGeo.torso.dispose()
    this._pedestrianGeo.head.dispose()
    this._pedestrianGeo.leg.dispose()
    this._pedestrianGeo.arm.dispose()
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
