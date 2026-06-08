import { BuildingBuilder } from './BuildingBuilder.js'
import { RoadBuilder } from './RoadBuilder.js'
import { GreeneryBuilder } from './GreeneryBuilder.js'

export class DistrictModelBuilder {
  constructor(scene) {
    this.scene = scene
    this.buildingBuilder = new BuildingBuilder(scene)
    this.roadBuilder = new RoadBuilder(scene)
    this.greeneryBuilder = new GreeneryBuilder(scene)
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

  updateAnimation(elapsed) {
    this.greeneryBuilder.updateAnimation(elapsed)
  }

  dispose() {
    this.buildingBuilder.dispose()
    this.roadBuilder.dispose()
    this.greeneryBuilder.dispose()
  }
}
