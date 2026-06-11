import * as THREE from 'three'
import { CarBuilder } from './CarBuilder.js'
import { PedestrianBuilder } from './PedestrianBuilder.js'

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
