import * as THREE from 'three'
import { CarBuilder } from './CarBuilder.js'
import { PedestrianBuilder } from './PedestrianBuilder.js'

const PED_CAR_MIN_DIST = 2.5
const PED_CAR_SLOW_DIST = 5.0

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

  _checkPedestrianCarDistances() {
    const pedestrians = this.pedestrianBuilder.pedestrians
    const cars = this.carBuilder.cars
    if (!pedestrians.length || !cars.length) return

    for (const ped of pedestrians) {
      if (ped.isIdle) continue

      const pedPos = ped.group.position
      let nearestCarDist = Infinity

      for (const car of cars) {
        const carPos = car.group.position
        const dist = pedPos.distanceTo(carPos)
        if (dist < nearestCarDist) nearestCarDist = dist
      }

      if (nearestCarDist < PED_CAR_MIN_DIST) {
        ped.isWaitingForCar = true
        ped.waitSpeedFactor = 0
      } else if (nearestCarDist < PED_CAR_SLOW_DIST) {
        ped.isWaitingForCar = true
        const recovery = (nearestCarDist - PED_CAR_MIN_DIST) / (PED_CAR_SLOW_DIST - PED_CAR_MIN_DIST)
        ped.waitSpeedFactor = recovery
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
