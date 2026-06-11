import { BuildingBuilder } from './BuildingBuilder.js'
import { RoadBuilder } from './RoadBuilder.js'
import { GreeneryBuilder } from './GreeneryBuilder.js'
import { StallBuilder } from './StallBuilder.js'
import { VehicleBuilder } from './VehicleBuilder.js'
import { LandscapeBuilder } from './LandscapeBuilder.js'
import { AnimalBuilder } from './AnimalBuilder.js'

export class DistrictModelBuilder {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    this.buildingBuilder = new BuildingBuilder(scene)
    this.roadBuilder = new RoadBuilder(scene)
    this.greeneryBuilder = new GreeneryBuilder(scene)
    this.stallBuilder = new StallBuilder(scene)
    this.vehicleBuilder = new VehicleBuilder(scene, camera)
    this.landscapeBuilder = new LandscapeBuilder(scene)
    this.animalBuilder = new AnimalBuilder(scene)
  }

  buildDistrict(config) {
    if (config.buildings) {
      this.buildingBuilder.buildFromConfig(config.buildings)
    }
    if (config.roads) {
      this.roadBuilder.buildFromConfig(config.roads)
      this.landscapeBuilder.setRoadPaths(config.roads)
    }
    if (config.greenery) {
      this.greeneryBuilder.buildFromConfig(config.greenery)
    }
    if (config.stalls) {
      this.stallBuilder.buildFromConfig(config.stalls)
    }
    if (config.vehicles) {
      this.vehicleBuilder.buildFromConfig(config.vehicles)
    }
    if (config.landscape) {
      this.landscapeBuilder.buildFromConfig(config.landscape)
    }
    if (config.animals) {
      this.animalBuilder.buildFromConfig(config.animals)
    }
  }

  getBuildingBuilder() {
    return this.buildingBuilder
  }

  getRoadBuilder() {
    return this.roadBuilder
  }

  getGreeneryBuilder() {
    return this.greeneryBuilder
  }

  getStallBuilder() {
    return this.stallBuilder
  }

  getVehicleBuilder() {
    return this.vehicleBuilder
  }

  getLandscapeBuilder() {
    return this.landscapeBuilder
  }

  getAnimalBuilder() {
    return this.animalBuilder
  }

  updateAnimation(delta, elapsed) {
    this.buildingBuilder.updateAnimation(elapsed)
    this.greeneryBuilder.updateAnimation(elapsed)
    this.stallBuilder.updateAnimation(elapsed)
    this.vehicleBuilder.updateAnimation(delta, elapsed)
    this.landscapeBuilder.updateAnimation(elapsed)
    this.animalBuilder.updateAnimation(delta, elapsed)
  }

  dispose() {
    this.buildingBuilder.dispose()
    this.roadBuilder.dispose()
    this.greeneryBuilder.dispose()
    this.stallBuilder.dispose()
    this.vehicleBuilder.dispose()
    this.landscapeBuilder.dispose()
    this.animalBuilder.dispose()
  }
}
