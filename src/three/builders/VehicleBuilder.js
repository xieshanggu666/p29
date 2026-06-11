import * as THREE from 'three'
import { CarBuilder } from './CarBuilder.js'
import { PedestrianBuilder } from './PedestrianBuilder.js'

const PED_CAR_AVOID_DIST = 3.0
const PED_CAR_SLOW_DIST = 6.0
const PED_RADIUS = 0.4

const CAR_BOUNDING = {
  sedan: { halfLength: 1.7, halfWidth: 0.8 },
  suv: { halfLength: 1.9, halfWidth: 0.9 },
  van: { halfLength: 2.1, halfWidth: 1.0 },
  default: { halfLength: 1.7, halfWidth: 0.8 },
}

export class VehicleBuilder {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    this.vehicleGroup = new THREE.Group()
    this.vehicleGroup.name = 'vehicles'
    this.scene.add(this.vehicleGroup)

    this.carBuilder = new CarBuilder(this.vehicleGroup)
    this.pedestrianBuilder = new PedestrianBuilder(this.vehicleGroup, camera)
  }

  buildFromConfig(config) {
    this.pedestrianBuilder.buildFromConfig(config)
    this.carBuilder.buildFromConfig(config)
  }

  createPedestrian({ id, path, speed = 1, color = 0x334455, closed = false }) {
    return this.pedestrianBuilder.createPedestrian({ id, path, speed, color, closed })
  }

  createCar({ id, path, speed = 1.5, color = 0xcc3333, type = 'sedan', closed = false }) {
    return this.carBuilder.createCar({ id, path, speed, color, type, closed })
  }

  updateAnimation(delta, elapsed) {
    this.pedestrianBuilder.updateAnimation(delta, elapsed)
    this.carBuilder.updateAnimation(delta, elapsed)
    this._checkPedestrianCarDistances()
  }

  _getCarBoundingBox(car) {
    const carType = car.group.userData.carType || 'default'
    return CAR_BOUNDING[carType] || CAR_BOUNDING.default
  }

  _pointToOBBDisplacement(px, pz, car) {
    const box = this._getCarBoundingBox(car)
    const carPos = car.group.position
    const carRot = car.group.rotation.y

    const dx = px - carPos.x
    const dz = pz - carPos.z

    const cosR = Math.cos(-carRot)
    const sinR = Math.sin(-carRot)

    const localX = dx * cosR - dz * sinR
    const localZ = dx * sinR + dz * cosR

    const clampedX = Math.max(-box.halfWidth, Math.min(box.halfWidth, localX))
    const clampedZ = Math.max(-box.halfLength, Math.min(box.halfLength, localZ))

    const dispLocalX = localX - clampedX
    const dispLocalZ = localZ - clampedZ
    const dist = Math.sqrt(dispLocalX * dispLocalX + dispLocalZ * dispLocalZ)

    const cosR2 = Math.cos(carRot)
    const sinR2 = Math.sin(carRot)
    const worldDispX = dispLocalX * cosR2 - dispLocalZ * sinR2
    const worldDispZ = dispLocalX * sinR2 + dispLocalZ * cosR2

    return { dist, worldDispX, worldDispZ }
  }

  _checkPedestrianCarDistances() {
    const pedestrians = this.pedestrianBuilder.pedestrians
    const cars = this.carBuilder.cars
    if (!pedestrians.length || !cars.length) return

    for (const ped of pedestrians) {
      if (ped.isIdle) {
        ped.waitSpeedFactor = 1
        ped.isWaitingForCar = false
        continue
      }

      const px = ped.group.position.x
      const pz = ped.group.position.z
      let minDist = Infinity
      let nearestDispX = 0
      let nearestDispZ = 0

      for (const car of cars) {
        const result = this._pointToOBBDisplacement(px, pz, car)
        if (result.dist < minDist) {
          minDist = result.dist
          nearestDispX = result.worldDispX
          nearestDispZ = result.worldDispZ
        }
      }

      const adjustedDist = minDist - PED_RADIUS

      if (adjustedDist < 0) {
        ped.isWaitingForCar = true
        ped.waitSpeedFactor = 0
        const pushDist = Math.max(0.01, Math.sqrt(nearestDispX * nearestDispX + nearestDispZ * nearestDispZ))
        const pushStrength = (-adjustedDist + 0.1) * 0.5
        ped.group.position.x += (nearestDispX / pushDist) * pushStrength
        ped.group.position.z += (nearestDispZ / pushDist) * pushStrength
      } else if (adjustedDist < PED_CAR_AVOID_DIST) {
        ped.isWaitingForCar = true
        ped.waitSpeedFactor = adjustedDist / PED_CAR_AVOID_DIST
      } else if (adjustedDist < PED_CAR_SLOW_DIST) {
        ped.isWaitingForCar = false
        const recovery = (adjustedDist - PED_CAR_AVOID_DIST) / (PED_CAR_SLOW_DIST - PED_CAR_AVOID_DIST)
        ped.waitSpeedFactor = 0.5 + recovery * 0.5
      } else {
        ped.isWaitingForCar = false
        ped.waitSpeedFactor = 1
      }
    }
  }

  getPedestrianStats() {
    return this.pedestrianBuilder.getPerformanceStats()
  }

  getCarStats() {
    return this.carBuilder.getPerformanceStats()
  }

  getVehicleById(id) {
    return this.vehicleGroup.children.find(g =>
      g.userData.vehicleId === id || g.userData.pedestrianId === id
    )
  }

  dispose() {
    this.pedestrianBuilder.dispose()
    this.carBuilder.dispose()
    this.scene.remove(this.vehicleGroup)
  }
}
