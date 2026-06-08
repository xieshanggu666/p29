import { BuildingBuilder } from './BuildingBuilder.js'
import { RoadBuilder } from './RoadBuilder.js'
import { GreeneryBuilder } from './GreeneryBuilder.js'
import { StallBuilder } from './StallBuilder.js'
import { VehicleBuilder } from './VehicleBuilder.js'

export class DistrictModelBuilder {
  constructor(scene) {
    this.scene = scene
    this.buildingBuilder = new BuildingBuilder(scene)
    this.roadBuilder = new RoadBuilder(scene)
    this.greeneryBuilder = new GreeneryBuilder(scene)
    this.stallBuilder = new StallBuilder(scene)
    this.vehicleBuilder = new VehicleBuilder(scene)
  }

  buildDistrict(config) {
    if (config.buildings) {
      this.buildingBuilder.buildFromConfig(config.buildings)
    }
    if (config.roads) {
      this.roadBuilder.buildFromConfig(config.roads)
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

  updateAnimation(delta, elapsed) {
    this.greeneryBuilder.updateAnimation(elapsed)
    this.stallBuilder.updateAnimation(elapsed)
    this.vehicleBuilder.updateAnimation(delta, elapsed)
  }

  dispose() {
    this.buildingBuilder.dispose()
    this.roadBuilder.dispose()
    this.greeneryBuilder.dispose()
    this.stallBuilder.dispose()
    this.vehicleBuilder.dispose()
  }
}
