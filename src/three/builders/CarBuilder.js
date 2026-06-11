import * as THREE from 'three'

const _sharedMats = {
  tire: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }),
  rim: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.9 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x88bbdd, roughness: 0.05, metalness: 0.1,
    transparent: true, opacity: 0.4, side: THREE.DoubleSide,
  }),
  headlight: new THREE.MeshStandardMaterial({
    color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 0.8, roughness: 0.1,
  }),
  taillight: new THREE.MeshStandardMaterial({
    color: 0xff4444, emissive: 0xff0000, emissiveIntensity: 0.5, roughness: 0.2,
  }),
  interior: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 }),
  seat: new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 }),
  steering: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.3 }),
}

export class CarBuilder {
  constructor(parentGroup) {
    this.parentGroup = parentGroup
    this.carGroup = new THREE.Group()
    this.carGroup.name = 'cars'
    this.parentGroup.add(this.carGroup)

    this.cars = []
    this._carGeo = this._createCarGeometry()
  }

  buildFromConfig(config) {
    if (!config.cars) return
    for (const item of config.cars) {
      this.createCar(item)
    }
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

    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.2,
      metalness: 0.8,
    })

    let buildResult
    if (type === 'sedan') {
      buildResult = this._buildSedan(group, bodyMat)
    } else if (type === 'suv') {
      buildResult = this._buildSuv(group, bodyMat)
    } else if (type === 'van') {
      buildResult = this._buildVan(group, bodyMat)
    }

    const { wheelGroups } = buildResult || {}

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
      wheelGroups: wheelGroups || [],
      wheelRotation: 0,
    }

    this.cars.push(carData)
    this.carGroup.add(group)
    return group
  }

  _buildSedan(group, bodyMat) {
    const body = new THREE.Mesh(this._carGeo.sedanBody, bodyMat)
    body.position.y = 0.5
    body.castShadow = true
    group.add(body)

    const cabin = new THREE.Mesh(this._carGeo.sedanCabin, _sharedMats.glass)
    cabin.position.set(0, 0.95, 0)
    group.add(cabin)

    this._addInterior(group, 0.55, 0.1)

    const wheelGroups = this._addWheels(group, 0.35, [
      [-0.7, 0.35, 1.05],
      [0.7, 0.35, 1.05],
      [-0.7, 0.35, -1.05],
      [0.7, 0.35, -1.05],
    ])

    this._addLights(group, 0.55, 1.5)

    return { wheelGroups }
  }

  _buildSuv(group, bodyMat) {
    const body = new THREE.Mesh(this._carGeo.suvBody, bodyMat)
    body.position.y = 0.65
    body.castShadow = true
    group.add(body)

    const cabin = new THREE.Mesh(this._carGeo.suvCabin, _sharedMats.glass)
    cabin.position.set(0, 1.23, 0)
    group.add(cabin)

    this._addInterior(group, 0.7, 0.2)

    const wheelGroups = this._addWheels(group, 0.4, [
      [-0.8, 0.4, 1.15],
      [0.8, 0.4, 1.15],
      [-0.8, 0.4, -1.15],
      [0.8, 0.4, -1.15],
    ])

    this._addLights(group, 0.7, 1.7)

    return { wheelGroups }
  }

  _buildVan(group, bodyMat) {
    const body = new THREE.Mesh(this._carGeo.vanBody, bodyMat)
    body.position.y = 0.85
    body.castShadow = true
    group.add(body)

    const cabin = new THREE.Mesh(this._carGeo.vanCabin, _sharedMats.glass)
    cabin.position.set(0, 1.55, 1.2)
    group.add(cabin)

    this._addInterior(group, 0.9, 1.4)

    const wheelGroups = this._addWheels(group, 0.4, [
      [-0.85, 0.4, 1.35],
      [0.85, 0.4, 1.35],
      [-0.85, 0.4, -1.35],
      [0.85, 0.4, -1.35],
    ])

    this._addLights(group, 0.9, 1.9)

    return { wheelGroups }
  }

  _addWheels(group, radius, positions) {
    const wheelGroups = []
    for (const pos of positions) {
      const wheelGroup = new THREE.Group()
      wheelGroup.name = 'wheel'

      const innerGroup = new THREE.Group()
      innerGroup.rotation.z = Math.PI / 2
      wheelGroup.add(innerGroup)

      const tire = new THREE.Mesh(this._carGeo.wheelTire, _sharedMats.tire)
      tire.scale.set(radius, 1, radius)
      innerGroup.add(tire)

      const rim = new THREE.Mesh(this._carGeo.wheelRim, _sharedMats.rim)
      rim.scale.set(radius * 0.55, 1, radius * 0.55)
      innerGroup.add(rim)

      wheelGroup.position.set(pos[0], pos[1], pos[2])
      wheelGroup.userData.radius = radius
      group.add(wheelGroup)
      wheelGroups.push(wheelGroup)
    }
    return wheelGroups
  }

  _addLights(group, yPos, halfLength) {
    const frontLeft = new THREE.Mesh(this._carGeo.headlight, _sharedMats.headlight)
    frontLeft.position.set(-0.5, yPos, halfLength)
    frontLeft.rotation.x = -Math.PI / 2
    group.add(frontLeft)

    const frontRight = new THREE.Mesh(this._carGeo.headlight, _sharedMats.headlight)
    frontRight.position.set(0.5, yPos, halfLength)
    frontRight.rotation.x = -Math.PI / 2
    group.add(frontRight)

    const tailLeft = new THREE.Mesh(this._carGeo.taillight, _sharedMats.taillight)
    tailLeft.position.set(-0.5, yPos, -halfLength)
    group.add(tailLeft)

    const tailRight = new THREE.Mesh(this._carGeo.taillight, _sharedMats.taillight)
    tailRight.position.set(0.5, yPos, -halfLength)
    group.add(tailRight)
  }

  _createCarGeometry() {
    const sedanBodyLower = (() => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.7, 0)
      shape.lineTo(-0.7, 0.25)
      shape.quadraticCurveTo(-0.7, 0.4, -0.48, 0.45)
      shape.lineTo(0.48, 0.45)
      shape.quadraticCurveTo(0.7, 0.4, 0.7, 0.25)
      shape.lineTo(0.7, 0)
      shape.lineTo(-0.7, 0)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 3.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 })
      geo.translate(0, 0, -1.6)
      return geo
    })()

    const sedanGlassCabin = (() => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.48, 0)
      shape.lineTo(-0.4, 0.35)
      shape.quadraticCurveTo(0, 0.5, 0.4, 0.35)
      shape.lineTo(0.48, 0)
      shape.lineTo(-0.48, 0)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 2.8, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 })
      geo.translate(0, 0, -1.4)
      return geo
    })()

    const suvBodyLower = (() => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.8, 0)
      shape.lineTo(-0.8, 0.35)
      shape.quadraticCurveTo(-0.8, 0.5, -0.58, 0.58)
      shape.lineTo(0.58, 0.58)
      shape.quadraticCurveTo(0.8, 0.5, 0.8, 0.35)
      shape.lineTo(0.8, 0)
      shape.lineTo(-0.8, 0)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 3.6, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 })
      geo.translate(0, 0, -1.8)
      return geo
    })()

    const suvGlassCabin = (() => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.58, 0)
      shape.lineTo(-0.5, 0.55)
      shape.quadraticCurveTo(0, 0.65, 0.5, 0.55)
      shape.lineTo(0.58, 0)
      shape.lineTo(-0.58, 0)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 3.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 })
      geo.translate(0, 0, -1.65)
      return geo
    })()

    const vanBodyLower = (() => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.9, 0)
      shape.lineTo(-0.9, 0.5)
      shape.lineTo(-0.65, 0.7)
      shape.lineTo(0.65, 0.7)
      shape.lineTo(0.9, 0.5)
      shape.lineTo(0.9, 0)
      shape.lineTo(-0.9, 0)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 4.0, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 })
      geo.translate(0, 0, -2.0)
      return geo
    })()

    const vanGlassCabin = (() => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.65, 0)
      shape.lineTo(-0.58, 0.6)
      shape.quadraticCurveTo(0, 0.7, 0.58, 0.6)
      shape.lineTo(0.65, 0)
      shape.lineTo(-0.65, 0)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 })
      geo.translate(0, 0, -0.65)
      return geo
    })()

    const wheelTire = new THREE.CylinderGeometry(1, 1, 0.22, 16, 1, false)
    const wheelRim = new THREE.CylinderGeometry(0.55, 0.55, 0.24, 8, 1, false)

    const headlight = (() => {
      const geo = new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2)
      geo.scale(1.2, 0.6, 1)
      return geo
    })()

    const taillight = new THREE.BoxGeometry(0.25, 0.1, 0.08)

    const seatBase = new THREE.BoxGeometry(0.35, 0.12, 0.4)
    const seatBack = new THREE.BoxGeometry(0.35, 0.5, 0.1)
    const steeringWheel = new THREE.TorusGeometry(0.12, 0.025, 8, 16)
    const steeringColumn = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6)
    const dashboard = new THREE.BoxGeometry(1.1, 0.12, 0.25)

    return {
      sedanBody: sedanBodyLower,
      sedanCabin: sedanGlassCabin,
      suvBody: suvBodyLower,
      suvCabin: suvGlassCabin,
      vanBody: vanBodyLower,
      vanCabin: vanGlassCabin,
      wheelTire,
      wheelRim,
      headlight,
      taillight,
      seatBase,
      seatBack,
      steeringWheel,
      steeringColumn,
      dashboard,
    }
  }

  _addInterior(group, seatY, frontZ, seatBackAngle = 0.15) {
    const floor = new THREE.Mesh(this._carGeo.dashboard, _sharedMats.interior)
    floor.scale.set(1, 0.5, 4)
    floor.position.set(0, seatY - 0.1, 0)
    group.add(floor)

    const seatPositions = [
      [-0.28, seatY, frontZ - 0.1],
      [0.28, seatY, frontZ - 0.1],
      [-0.28, seatY, frontZ - 0.7],
      [0.28, seatY, frontZ - 0.7],
    ]
    for (const [sx, sy, sz] of seatPositions) {
      const base = new THREE.Mesh(this._carGeo.seatBase, _sharedMats.seat)
      base.position.set(sx, sy, sz)
      group.add(base)

      const back = new THREE.Mesh(this._carGeo.seatBack, _sharedMats.seat)
      back.position.set(sx, sy + 0.3, sz - 0.2)
      back.rotation.x = seatBackAngle
      group.add(back)
    }

    const dash = new THREE.Mesh(this._carGeo.dashboard, _sharedMats.interior)
    dash.position.set(0, seatY + 0.25, frontZ + 0.25)
    group.add(dash)

    const column = new THREE.Mesh(this._carGeo.steeringColumn, _sharedMats.steering)
    column.position.set(-0.28, seatY + 0.2, frontZ + 0.05)
    column.rotation.z = Math.PI / 2.5
    group.add(column)

    const wheel = new THREE.Mesh(this._carGeo.steeringWheel, _sharedMats.steering)
    wheel.position.set(-0.28, seatY + 0.3, frontZ + 0.18)
    wheel.rotation.y = Math.PI / 2
    group.add(wheel)
  }

  updateAnimation(delta, elapsed) {
    const clampedDelta = Math.min(delta, 0.05)

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

      if (car.wheelGroups && car.wheelGroups.length > 0) {
        const wheelRadius = car.wheelGroups[0].userData.radius || 0.35
        const angularSpeed = (clampedDelta * car.speed * 0.5) / Math.max(wheelRadius, 0.01)
        car.wheelRotation += angularSpeed * car.direction
        for (const wheel of car.wheelGroups) {
          wheel.rotation.x = car.wheelRotation
        }
      }
    }
  }

  _lerpAngle(current, target, factor) {
    let diff = target - current
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    return current + diff * factor
  }

  dispose() {
    Object.values(this._carGeo).forEach(g => g.dispose())

    this.carGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
        else child.material.dispose()
      }
    })
    this.parentGroup.remove(this.carGroup)
    this.cars = []
  }
}
