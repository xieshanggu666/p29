import * as THREE from 'three'

export class AnimalBuilder {
  constructor(scene) {
    this.scene = scene
    this.animalGroup = new THREE.Group()
    this.animalGroup.name = 'animals'
    this.scene.add(this.animalGroup)

    this.birds = []
    this.fishSchools = []

    this._birdGeo = this._createBirdGeometry()
    this._fishGeo = this._createFishGeometry()
    this._birdMats = this._createBirdMaterials()
    this._fishMats = this._createFishMaterials()
  }

  _createBirdMaterials() {
    return {
      body: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.1 }),
      wing: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7, metalness: 0.05, side: THREE.DoubleSide }),
      beak: new THREE.MeshStandardMaterial({ color: 0xcc8800, roughness: 0.5 }),
    }
  }

  _createFishMaterials() {
    return {
      body: new THREE.MeshStandardMaterial({ color: 0xcc8844, roughness: 0.3, metalness: 0.5 }),
      belly: new THREE.MeshStandardMaterial({ color: 0xddccaa, roughness: 0.4, metalness: 0.3 }),
      fin: new THREE.MeshStandardMaterial({ color: 0xcc8844, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
      eye: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.8 }),
    }
  }

  buildFromConfig(config) {
    if (config.birds) {
      for (const item of config.birds) {
        this.createBird(item)
      }
    }
    if (config.fishSchools) {
      for (const item of config.fishSchools) {
        this.createFishSchool(item)
      }
    }
  }

  createBird({ id, path, speed = 1, count = 3, flyHeight = 30, color = 0x222222, closed = true }) {
    const group = new THREE.Group()
    group.name = `bird_flock_${id}`
    group.userData = {
      interactive: true,
      animalId: id,
      category: 'bird',
    }

    const curve = new THREE.CatmullRomCurve3(
      path.map(p => new THREE.Vector3(p[0], flyHeight, p[1])),
      closed
    )

    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 })
    const wingMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, side: THREE.DoubleSide })

    const birdDataList = []

    for (let i = 0; i < count; i++) {
      const birdGroup = new THREE.Group()
      birdGroup.name = `bird_${id}_${i}`
      birdGroup.userData = { interactive: true, animalId: id, category: 'bird' }

      const body = new THREE.Mesh(this._birdGeo.body, bodyMat)
      body.castShadow = true
      birdGroup.add(body)

      const head = new THREE.Mesh(this._birdGeo.head, bodyMat)
      head.position.set(0.2, 0.05, 0)
      head.castShadow = true
      birdGroup.add(head)

      const beak = new THREE.Mesh(this._birdGeo.beak, this._birdMats.beak)
      beak.position.set(0.4, 0.02, 0)
      birdGroup.add(beak)

      const leftWing = new THREE.Mesh(this._birdGeo.wing, wingMat)
      leftWing.position.set(-0.05, 0.02, 0.15)
      leftWing.name = 'leftWing'
      leftWing.castShadow = true
      birdGroup.add(leftWing)

      const rightWing = new THREE.Mesh(this._birdGeo.wing, wingMat)
      rightWing.position.set(-0.05, 0.02, -0.15)
      rightWing.rotation.y = Math.PI
      rightWing.name = 'rightWing'
      rightWing.castShadow = true
      birdGroup.add(rightWing)

      const tail = new THREE.Mesh(this._birdGeo.tail, bodyMat)
      tail.position.set(-0.3, 0.03, 0)
      tail.rotation.y = Math.PI
      birdGroup.add(tail)

      const progressOffset = i / count
      const heightOffset = (Math.random() - 0.5) * 1.5
      const lateralOffset = (Math.random() - 0.5) * 3

      birdDataList.push({
        group: birdGroup,
        leftWing,
        rightWing,
        curve,
        speed,
        progress: progressOffset,
        heightOffset,
        lateralOffset,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 8 + Math.random() * 4,
        glideTimer: Math.random() * 6,
        isGliding: false,
        glideDuration: 1.5 + Math.random() * 2,
        flapDuration: 4 + Math.random() * 6,
        floatPhase: Math.random() * Math.PI * 2,
        floatFreq: 0.3 + Math.random() * 0.4,
        floatAmp: 0.15 + Math.random() * 0.15,
        swayPhase: Math.random() * Math.PI * 2,
        swayFreq: 0.5 + Math.random() * 0.3,
        prevTangent: new THREE.Vector3(),
        bankAngle: 0,
        closed,
      })

      group.add(birdGroup)
    }

    this.birds.push(...birdDataList)
    this.animalGroup.add(group)
    return group
  }

  createFishSchool({ id, center, radii, count = 6, color = 0xcc8844, speed = 1, waterY = 0.05 }) {
    const group = new THREE.Group()
    group.name = `fish_school_${id}`
    group.position.set(center[0], 0, center[1])
    group.userData = {
      interactive: true,
      animalId: id,
      category: 'fish',
      center,
      radii,
    }

    const fishMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 })
    const finMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })

    const fishDataList = []

    for (let i = 0; i < count; i++) {
      const fishGroup = new THREE.Group()
      fishGroup.name = `fish_${id}_${i}`
      fishGroup.userData = { interactive: true, animalId: id, category: 'fish' }

      const body = new THREE.Mesh(this._fishGeo.body, fishMat)
      fishGroup.add(body)

      const belly = new THREE.Mesh(this._fishGeo.belly, this._fishMats.belly)
      fishGroup.add(belly)

      const tail = new THREE.Mesh(this._fishGeo.tail, finMat)
      tail.position.set(-0.4, 0, 0)
      tail.name = 'fishTail'
      fishGroup.add(tail)

      const dorsalFin = new THREE.Mesh(this._fishGeo.dorsal, finMat)
      dorsalFin.position.set(-0.05, 0.12, 0)
      fishGroup.add(dorsalFin)

      const leftPecFin = new THREE.Mesh(this._fishGeo.pecFin, finMat)
      leftPecFin.position.set(0.05, -0.02, 0.1)
      leftPecFin.name = 'leftPecFin'
      fishGroup.add(leftPecFin)

      const rightPecFin = new THREE.Mesh(this._fishGeo.pecFin, finMat)
      rightPecFin.position.set(0.05, -0.02, -0.1)
      rightPecFin.rotation.y = Math.PI
      rightPecFin.name = 'rightPecFin'
      fishGroup.add(rightPecFin)

      const leftEye = new THREE.Mesh(this._fishGeo.eye, this._fishMats.eye)
      leftEye.position.set(0.22, 0.04, 0.06)
      fishGroup.add(leftEye)

      const rightEye = new THREE.Mesh(this._fishGeo.eye, this._fishMats.eye)
      rightEye.position.set(0.22, 0.04, -0.06)
      fishGroup.add(rightEye)

      const rx = radii[0] * (0.3 + Math.random() * 0.5)
      const rz = radii[1] * (0.3 + Math.random() * 0.5)
      const depthOffset = -(0.05 + Math.random() * 0.2)
      const fishSpeed = speed * (0.7 + Math.random() * 0.6)

      const pathPoints = this._generateFishPath(rx, rz, 6 + Math.floor(Math.random() * 4))

      fishDataList.push({
        group: fishGroup,
        tailMesh: tail,
        leftPecFinMesh: leftPecFin,
        rightPecFinMesh: rightPecFin,
        path: pathPoints,
        progress: Math.random(),
        speed: fishSpeed,
        depthOffset,
        waterY,
        tailPhase: Math.random() * Math.PI * 2,
        swimPhase: Math.random() * Math.PI * 2,
        dartTimer: 2 + Math.random() * 5,
        isDarting: false,
        dartDuration: 0,
        baseSpeed: fishSpeed,
        prevDir: new THREE.Vector3(1, 0, 0),
        bankAngle: 0,
        pitchAngle: 0,
      })

      group.add(fishGroup)
    }

    this.fishSchools.push(...fishDataList)
    this.animalGroup.add(group)
    return group
  }

  _generateFishPath(rx, rz, numPoints) {
    const points = []
    for (let i = 0; i < numPoints; i++) {
      const baseAngle = (i / numPoints) * Math.PI * 2
      const jitterR = 0.7 + Math.random() * 0.6
      const jitterA = (Math.random() - 0.5) * 0.4
      const a = baseAngle + jitterA
      points.push(new THREE.Vector3(
        Math.cos(a) * rx * jitterR,
        0,
        Math.sin(a) * rz * jitterR
      ))
    }
    return new THREE.CatmullRomCurve3(points, true)
  }

  _createBirdGeometry() {
    return {
      body: new THREE.ConeGeometry(0.08, 0.5, 6),
      head: new THREE.SphereGeometry(0.06, 6, 5),
      beak: new THREE.ConeGeometry(0.02, 0.1, 4),
      wing: (() => {
        const shape = new THREE.Shape()
        shape.moveTo(0, 0)
        shape.quadraticCurveTo(0.2, 0.15, 0.5, 0.05)
        shape.quadraticCurveTo(0.3, -0.02, 0, 0)
        const geo = new THREE.ShapeGeometry(shape)
        return geo
      })(),
      tail: (() => {
        const shape = new THREE.Shape()
        shape.moveTo(0, 0)
        shape.lineTo(0.15, 0.06)
        shape.lineTo(0.15, -0.06)
        shape.lineTo(0, 0)
        return new THREE.ShapeGeometry(shape)
      })(),
    }
  }

  _createFishGeometry() {
    return {
      body: (() => {
        const geo = new THREE.SphereGeometry(0.15, 8, 6)
        const pos = geo.attributes.position
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i)
          const y = pos.getY(i)
          const z = pos.getZ(i)
          pos.setX(i, x * 2.0)
          pos.setY(i, y * 0.7)
          pos.setZ(i, z * 0.5)
        }
        geo.computeVertexNormals()
        return geo
      })(),
      belly: (() => {
        const geo = new THREE.SphereGeometry(0.13, 8, 6)
        const pos = geo.attributes.position
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i)
          const y = pos.getY(i)
          const z = pos.getZ(i)
          pos.setX(i, x * 1.8)
          pos.setY(i, y * 0.5 - 0.03)
          pos.setZ(i, z * 0.4)
        }
        geo.computeVertexNormals()
        return geo
      })(),
      tail: (() => {
        const shape = new THREE.Shape()
        shape.moveTo(0, 0)
        shape.quadraticCurveTo(-0.08, 0.12, -0.15, 0.15)
        shape.lineTo(0, 0.03)
        shape.lineTo(-0.15, -0.15)
        shape.quadraticCurveTo(-0.08, -0.12, 0, 0)
        return new THREE.ShapeGeometry(shape)
      })(),
      dorsal: (() => {
        const shape = new THREE.Shape()
        shape.moveTo(0, 0)
        shape.quadraticCurveTo(0.05, 0.1, 0.12, 0.08)
        shape.lineTo(0.15, 0)
        shape.lineTo(0, 0)
        return new THREE.ShapeGeometry(shape)
      })(),
      pecFin: (() => {
        const shape = new THREE.Shape()
        shape.moveTo(0, 0)
        shape.quadraticCurveTo(0.05, 0.06, 0.12, 0.04)
        shape.lineTo(0.1, 0)
        shape.lineTo(0, 0)
        return new THREE.ShapeGeometry(shape)
      })(),
      eye: new THREE.SphereGeometry(0.02, 6, 4),
    }
  }

  updateAnimation(delta, elapsed) {
    this._updateBirds(delta, elapsed)
    this._updateFish(delta, elapsed)
  }

  _updateBirds(delta, elapsed) {
    for (const bird of this.birds) {
      bird.progress += delta * bird.speed * 0.02

      if (bird.closed) {
        if (bird.progress >= 1) bird.progress -= 1
      } else {
        if (bird.progress >= 1) bird.progress = 0
      }

      const t = Math.max(0.001, Math.min(0.999, bird.progress))
      const point = bird.curve.getPointAt(t)
      const tangent = bird.curve.getTangentAt(t)

      const perpX = -tangent.z
      const perpZ = tangent.x
      const lateralX = perpX * bird.lateralOffset
      const lateralZ = perpZ * bird.lateralOffset

      const floatY = Math.sin(elapsed * bird.floatFreq + bird.floatPhase) * bird.floatAmp
            + Math.sin(elapsed * bird.floatFreq * 1.7 + bird.floatPhase * 0.6) * bird.floatAmp * 0.3

      bird.group.position.set(
        point.x + lateralX,
        point.y + bird.heightOffset + floatY,
        point.z + lateralZ
      )

      const angle = Math.atan2(tangent.x, tangent.z)
      bird.group.rotation.y = angle

      if (bird.prevTangent.lengthSq() > 0) {
        const crossY = bird.prevTangent.x * tangent.z - bird.prevTangent.z * tangent.x
        const dot = bird.prevTangent.dot(tangent)
        const turnRate = Math.atan2(crossY, dot)
        const targetBank = -turnRate * 8
        bird.bankAngle += (targetBank - bird.bankAngle) * Math.min(1, delta * 3)
      }
      bird.prevTangent.copy(tangent)

      const swayRoll = Math.sin(elapsed * bird.swayFreq + bird.swayPhase) * 0.02
      bird.group.rotation.z = bird.bankAngle + swayRoll

      bird.glideTimer += delta
      if (!bird.isGliding) {
        if (bird.glideTimer > bird.flapDuration) {
          bird.isGliding = true
          bird.glideTimer = 0
          bird.glideDuration = 1.5 + Math.random() * 2.5
        }
      } else {
        if (bird.glideTimer > bird.glideDuration) {
          bird.isGliding = false
          bird.glideTimer = 0
          bird.flapDuration = 3 + Math.random() * 5
        }
      }

      bird.wingPhase += delta * (bird.isGliding ? 1.5 : bird.wingSpeed)

      let wingAngle
      if (bird.isGliding) {
        const glideTransition = Math.min(1, bird.glideTimer * 2)
        const glideWing = 0.35 + Math.sin(bird.wingPhase) * 0.08
        const flapWing = Math.sin(bird.wingPhase) * 0.6
        wingAngle = flapWing + (glideWing - flapWing) * glideTransition
      } else {
        const rawFlap = Math.sin(bird.wingPhase)
        const downStroke = rawFlap < 0 ? -Math.pow(-rawFlap, 0.7) : Math.pow(rawFlap, 1.3)
        wingAngle = downStroke * 0.65
      }

      if (bird.leftWing) bird.leftWing.rotation.x = wingAngle
      if (bird.rightWing) bird.rightWing.rotation.x = -wingAngle

      const wingLift = bird.isGliding ? 0 : Math.sin(bird.wingPhase) * 0.03
      bird.group.rotation.x = -floatY * 0.02 + wingLift
    }
  }

  _updateFish(delta, elapsed) {
    for (const fish of this.fishSchools) {
      fish.dartTimer -= delta
      if (!fish.isDarting && fish.dartTimer <= 0) {
        fish.isDarting = true
        fish.dartDuration = 0.4 + Math.random() * 0.8
        fish.speed = fish.baseSpeed * (2.5 + Math.random())
      }
      if (fish.isDarting) {
        fish.dartDuration -= delta
        if (fish.dartDuration <= 0) {
          fish.isDarting = false
          fish.speed = fish.baseSpeed
          fish.dartTimer = 2 + Math.random() * 6
        }
      }

      fish.progress += delta * fish.speed * 0.015
      if (fish.progress >= 1) fish.progress -= 1

      const t = Math.max(0.001, Math.min(0.999, fish.progress))
      const point = fish.path.getPointAt(t)
      const tangent = fish.path.getTangentAt(t)

      const yBob = Math.sin(elapsed * 1.2 + fish.swimPhase) * 0.04
        + Math.sin(elapsed * 0.7 + fish.swimPhase * 1.3) * 0.02
      const dartY = fish.isDarting ? -0.08 : 0
      const yPos = fish.waterY + fish.depthOffset + yBob + dartY

      fish.group.position.set(point.x, yPos, point.z)

      const dir = tangent.clone().normalize()
      const facing = Math.atan2(dir.x, dir.z)
      fish.group.rotation.y = facing

      if (fish.prevDir.lengthSq() > 0) {
        const crossY = fish.prevDir.x * dir.z - fish.prevDir.z * dir.x
        const dot = fish.prevDir.dot(dir)
        const turnRate = Math.atan2(crossY, dot)
        const targetBank = turnRate * 4
        fish.bankAngle += (targetBank - fish.bankAngle) * Math.min(1, delta * 4)
      }
      fish.prevDir.copy(dir)

      const targetPitch = fish.isDarting ? -0.15 : 0
      fish.pitchAngle += (targetPitch - fish.pitchAngle) * Math.min(1, delta * 5)

      const tailSpeed = fish.isDarting ? fish.speed * 14 : fish.speed * 8
      fish.tailPhase += delta * tailSpeed
      const tailSwing = Math.sin(fish.tailPhase) * (fish.isDarting ? 0.6 : 0.4)

      fish.tailMesh.rotation.y = tailSwing
      fish.leftPecFinMesh.rotation.z = Math.sin(fish.tailPhase * 0.8) * 0.35
      fish.rightPecFinMesh.rotation.z = -Math.sin(fish.tailPhase * 0.8) * 0.35

      fish.group.rotation.z = fish.bankAngle + Math.sin(fish.tailPhase) * 0.04
      fish.group.rotation.x = fish.pitchAngle
    }
  }

  getAnimalById(id) {
    return this.animalGroup.children.find(g => g.userData.animalId === id)
  }

  dispose() {
    this._disposeGeometry(this._birdGeo)
    this._disposeGeometry(this._fishGeo)

    this.animalGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
        else child.material.dispose()
      }
    })
    this.scene.remove(this.animalGroup)
    this.birds = []
    this.fishSchools = []
  }

  _disposeGeometry(geoSet) {
    for (const geo of Object.values(geoSet)) {
      if (geo && geo.dispose) geo.dispose()
    }
  }
}
