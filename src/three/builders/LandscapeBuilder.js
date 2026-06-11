import * as THREE from 'three'

export class LandscapeBuilder {
  constructor(scene) {
    this.scene = scene
    this.landscapeGroup = new THREE.Group()
    this.landscapeGroup.name = 'landscape'
    this.scene.add(this.landscapeGroup)
    this.waterMeshes = []
    this.circulationParticles = []
    this.roadPaths = []
    this._animatedBuoys = []
    this._warningLights = []
    this._circulationRings = []
    this._circulationArrows = []
    this._lifebuoyRings = []
  }

  setRoadPaths(roadPaths) {
    this.roadPaths = roadPaths
  }

  _checkRoadOverlap(center, radii) {
    if (!this.roadPaths || this.roadPaths.length === 0) return false
    const cx = center[0]
    const cz = center[1]
    const rx = radii[0]
    const rz = radii[1]
    const margin = 4

    for (const road of this.roadPaths) {
      if (!road.path) continue
      for (const pt of road.path) {
        const dx = pt[0] - cx
        const dz = pt[1] - cz
        const ellipseDist = (dx * dx) / ((rx + margin) * (rx + margin)) + (dz * dz) / ((rz + margin) * (rz + margin))
        if (ellipseDist <= 1) return true
      }
    }
    return false
  }

  _resolveOverlap(center, radii) {
    const offsets = [
      [0, -15], [-15, 0], [15, 0], [0, 15],
      [-15, -15], [15, -15], [-15, 15], [15, 15],
      [0, -25], [-25, 0], [25, 0], [0, 25],
    ]
    for (const offset of offsets) {
      const candidate = [center[0] + offset[0], center[1] + offset[1]]
      if (!this._checkRoadOverlap(candidate, radii)) {
        return candidate
      }
    }
    return [center[0] - 30, center[1] - 30]
  }

  buildFromConfig(config) {
    if (config.lake) {
      this.createLake(config.lake)
    }
    if (config.bridge) {
      this.createBridge(config.bridge)
    }
    if (config.swimmingArea) {
      this.createSwimmingArea(config.swimmingArea)
    }
  }

  createLake({ id, center, radii, depth, depths, waterColor, shoreColor, circulation }) {
    let adjustedCenter = [...center]
    if (this._checkRoadOverlap(center, radii)) {
      adjustedCenter = this._resolveOverlap(center, radii)
    }

    const group = new THREE.Group()
    group.name = `lake_${id}`
    group.position.set(adjustedCenter[0], 0, adjustedCenter[1])
    group.userData = { interactive: true, landscapeId: id, category: 'lake' }

    this._createLakeBed(group, radii, depth, depths, shoreColor)
    this._createWaterSurface(group, radii, waterColor)
    this._createLakeShore(group, radii, shoreColor)
    this._createEcologyZone(group, radii)

    if (circulation) {
      this._createCirculationSystem(group, adjustedCenter, circulation, radii)
    }

    this.landscapeGroup.add(group)
    return group
  }

  _createLakeBed(group, radii, depth, depths, shoreColor) {
    const segments = 48
    const positions = []
    const indices = []
    const normals = []

    positions.push(0, -0.3, 0)
    normals.push(0, 1, 0)

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const rx = radii[0]
      const rz = radii[1]
      const x = Math.cos(angle) * rx
      const z = Math.sin(angle) * rz
      let y = -0.3

      if (depths && depths.length > 0) {
        const totalDepths = depths.length
        for (const d of depths) {
          const dx = x - d.offset[0]
          const dz = z - d.offset[1]
          const dist = Math.sqrt(dx * dx + dz * dz)
          const influence = Math.max(0, 1 - dist / d.radius)
          y = Math.min(y, -0.3 - d.depth * influence * 0.3)
        }
      }

      positions.push(x, y, z)
      normals.push(0, 1, 0)
    }

    for (let i = 1; i <= segments; i++) {
      indices.push(0, i, i + 1)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a1f0f,
      roughness: 0.95,
      metalness: 0.0,
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.receiveShadow = true
    mesh.name = 'lakeBed'
    mesh.userData = { interactive: true, landscapeId: group.userData.landscapeId, category: 'lake' }
    group.add(mesh)
  }

  _createWaterSurface(group, radii, waterColor) {
    const segments = 48
    const rings = 12
    const waterY = 0.08
    const positions = []
    const indices = []
    const normals = []
    const uvs = []
    const baseYValues = []

    positions.push(0, waterY, 0)
    normals.push(0, 1, 0)
    uvs.push(0.5, 0.5)
    baseYValues.push(waterY)

    for (let ring = 1; ring <= rings; ring++) {
      const ringT = ring / rings
      const rx = radii[0] * ringT
      const rz = radii[1] * ringT

      for (let seg = 0; seg <= segments; seg++) {
        const angle = (seg / segments) * Math.PI * 2
        const x = Math.cos(angle) * rx
        const z = Math.sin(angle) * rz

        positions.push(x, waterY, z)
        normals.push(0, 1, 0)
        uvs.push(0.5 + Math.cos(angle) * ringT * 0.5, 0.5 + Math.sin(angle) * ringT * 0.5)
        baseYValues.push(waterY)
      }
    }

    for (let seg = 1; seg <= segments; seg++) {
      indices.push(0, seg, seg + 1)
    }

    for (let ring = 1; ring < rings; ring++) {
      const innerStart = 1 + (ring - 1) * (segments + 1)
      const outerStart = 1 + ring * (segments + 1)

      for (let seg = 0; seg < segments; seg++) {
        const a = innerStart + seg
        const b = a + 1
        const c = outerStart + seg
        const d = c + 1

        indices.push(a, c, b)
        indices.push(b, c, d)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geo.setIndex(indices)
    geo.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({
      color: waterColor || 0x1a6b8a,
      roughness: 0.02,
      metalness: 0.3,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.name = 'waterSurface'
    mesh.userData = { interactive: true, landscapeId: group.userData.landscapeId, category: 'lake', isWater: true }
    mesh.userData.baseYValues = new Float32Array(baseYValues)
    this.waterMeshes.push(mesh)
    group.add(mesh)
  }

  _createLakeShore(group, radii, shoreColor) {
    const segments = 64
    const positions = []
    const indices = []
    const shoreWidth = 2.0

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      const innerX = cos * radii[0]
      const innerZ = sin * radii[1]
      const outerX = cos * (radii[0] + shoreWidth)
      const outerZ = sin * (radii[1] + shoreWidth)

      positions.push(innerX, 0.12, innerZ)
      positions.push(outerX, 0.18, outerZ)
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2
      const b = a + 1
      const c = a + 2
      const d = a + 3
      indices.push(a, c, b)
      indices.push(b, c, d)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({
      color: shoreColor || 0x8b7d5e,
      roughness: 0.85,
      metalness: 0.0,
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.receiveShadow = true
    mesh.name = 'lakeShore'
    group.add(mesh)
  }

  _createEcologyZone(group, radii) {
    const ecologyItems = [
      { angle: 0.3, offset: 0.85, type: 'reed' },
      { angle: 0.8, offset: 0.9, type: 'reed' },
      { angle: 1.5, offset: 0.88, type: 'lily' },
      { angle: 2.2, offset: 0.75, type: 'lily' },
      { angle: 3.0, offset: 0.82, type: 'reed' },
      { angle: 3.8, offset: 0.87, type: 'lily' },
      { angle: 4.5, offset: 0.8, type: 'reed' },
      { angle: 5.2, offset: 0.9, type: 'lily' },
      { angle: 5.8, offset: 0.85, type: 'reed' },
    ]

    for (const item of ecologyItems) {
      const x = Math.cos(item.angle) * radii[0] * item.offset
      const z = Math.sin(item.angle) * radii[1] * item.offset

      if (item.type === 'reed') {
        this._createReedCluster(group, x, z)
      } else if (item.type === 'lily') {
        this._createLilyPad(group, x, z)
      }
    }
  }

  _createReedCluster(group, x, z) {
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x4a6b3a, roughness: 0.8 })
    const count = 3 + Math.floor(Math.random() * 4)

    for (let i = 0; i < count; i++) {
      const rx = x + (Math.random() - 0.5) * 1.5
      const rz = z + (Math.random() - 0.5) * 1.5
      const height = 1.5 + Math.random() * 1.5

      const reedGeo = new THREE.CylinderGeometry(0.03, 0.05, height, 4)
      const reed = new THREE.Mesh(reedGeo, reedMat)
      reed.position.set(rx, 0.08 + height / 2, rz)
      reed.rotation.z = (Math.random() - 0.5) * 0.15
      group.add(reed)
    }
  }

  _createLilyPad(group, x, z) {
    const lilyGeo = new THREE.CircleGeometry(0.4 + Math.random() * 0.3, 8)
    const lilyMat = new THREE.MeshStandardMaterial({
      color: 0x2d6b1a,
      roughness: 0.7,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })
    const lily = new THREE.Mesh(lilyGeo, lilyMat)
    lily.position.set(x, 0.09, z)
    lily.rotation.x = -Math.PI / 2
    group.add(lily)

    if (Math.random() > 0.5) {
      const flowerGeo = new THREE.SphereGeometry(0.15, 6, 4)
      const flowerMat = new THREE.MeshStandardMaterial({
        color: 0xffaacc,
        roughness: 0.5,
      })
      const flower = new THREE.Mesh(flowerGeo, flowerMat)
      flower.position.set(x, 0.15, z)
      flower.scale.y = 0.6
      group.add(flower)
    }
  }

  _createCirculationSystem(group, lakeCenter, circulation, radii) {
    const { inlet, outlet, flowPath } = circulation
    const cx = lakeCenter[0]
    const cz = lakeCenter[1]

    if (inlet) {
      this._createCirculationMarker(group, [inlet[0] - cx, inlet[1] - cz], 0x4488ff, 'inlet')
    }

    if (outlet) {
      this._createCirculationMarker(group, [outlet[0] - cx, outlet[1] - cz], 0x44ff88, 'outlet')
    }

    if (flowPath) {
      const localFlowPath = flowPath.map(p => [p[0] - cx, p[1] - cz])
      this._createFlowParticles(group, localFlowPath)
    }
  }

  _createCirculationMarker(group, pos, color, type) {
    const markerGroup = new THREE.Group()

    const pillarGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.2, 6)
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x666677, roughness: 0.6, metalness: 0.4 })
    const pillar = new THREE.Mesh(pillarGeo, pillarMat)
    pillar.position.y = 0.6
    markerGroup.add(pillar)

    const topGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 8)
    const topMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 })
    const top = new THREE.Mesh(topGeo, topMat)
    top.position.y = 1.25
    markerGroup.add(top)

    const ringGeo = new THREE.TorusGeometry(0.3, 0.05, 6, 12)
    const ringMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.y = 1.25
    ring.rotation.x = Math.PI / 2
    ring.name = `circulationRing_${type}`
    markerGroup.add(ring)
    this._circulationRings.push(ring)

    const arrowGeo = new THREE.ConeGeometry(0.2, 0.5, 6)
    const arrowMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2 })
    const arrow = new THREE.Mesh(arrowGeo, arrowMat)
    arrow.position.y = 0.3
    if (type === 'inlet') {
      arrow.rotation.z = Math.PI
    }
    arrow.name = `circulationArrow_${type}`
    markerGroup.add(arrow)
    this._circulationArrows.push(arrow)

    markerGroup.position.set(pos[0], 0, pos[1])
    markerGroup.name = `circulation_${type}`
    group.add(markerGroup)
  }

  _createFlowParticles(group, flowPath) {
    const curve = new THREE.CatmullRomCurve3(
      flowPath.map(p => new THREE.Vector3(p[0], 0.07, p[1])),
      false
    )

    const particleCount = 20
    const particleGeo = new THREE.SphereGeometry(0.08, 4, 4)
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.6,
      emissive: 0x4488ff,
      emissiveIntensity: 0.3,
    })

    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(particleGeo, particleMat.clone())
      const t = i / particleCount
      const point = curve.getPointAt(t)
      particle.position.copy(point)
      particle.name = 'flowParticle'
      particle.userData = { curve, t, speed: 0.02 + Math.random() * 0.01 }
      this.circulationParticles.push(particle)
      group.add(particle)
    }

    const flowLineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40))
    const flowLineMat = new THREE.LineBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.3,
    })
    const flowLine = new THREE.Line(flowLineGeo, flowLineMat)
    flowLine.position.y = 0.06
    flowLine.name = 'flowLine'
    group.add(flowLine)
  }

  createBridge({ id, startPoint, endPoint, width, railingHeight, woodColor, supportColor }) {
    const group = new THREE.Group()
    group.name = `bridge_${id}`
    group.userData = { interactive: true, landscapeId: id, category: 'bridge' }

    const start = new THREE.Vector3(startPoint[0], 0.3, startPoint[1])
    const end = new THREE.Vector3(endPoint[0], 0.3, endPoint[1])
    const direction = new THREE.Vector3().subVectors(end, start)
    const length = direction.length()
    direction.normalize()

    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x)

    this._createBridgeDeck(group, start, direction, perpendicular, length, width, woodColor)
    this._createBridgeRailings(group, start, direction, perpendicular, length, width, railingHeight, woodColor)
    this._createBridgeSupports(group, start, direction, perpendicular, length, width, supportColor)

    this.landscapeGroup.add(group)
    return group
  }

  _createBridgeDeck(group, start, direction, perpendicular, length, width, woodColor) {
    const deckSegments = 12
    const plankWidth = width / 3
    const plankGap = 0.02
    const deckMat = new THREE.MeshStandardMaterial({
      color: woodColor || 0x8B6914,
      roughness: 0.75,
      metalness: 0.05,
    })

    for (let s = 0; s < deckSegments; s++) {
      const t0 = s / deckSegments
      const t1 = (s + 1) / deckSegments
      const segLength = length / deckSegments

      const archOffset0 = Math.sin(t0 * Math.PI) * 0.5
      const archOffset1 = Math.sin(t1 * Math.PI) * 0.5
      const y0 = start.y + archOffset0
      const y1 = start.y + archOffset1

      for (let p = -1; p <= 1; p++) {
        const plankGeo = new THREE.BoxGeometry(segLength - plankGap, 0.12, plankWidth - plankGap)
        const plank = new THREE.Mesh(plankGeo, deckMat)
        const segCenter = t0 + (t1 - t0) / 2
        const pos = new THREE.Vector3().copy(start).addScaledVector(direction, segCenter * length)
        const archY = (y0 + y1) / 2
        plank.position.set(pos.x, archY, pos.z)
        plank.position.addScaledVector(perpendicular, p * plankWidth)

        const slopeAngle = Math.atan2(y1 - y0, segLength)
        plank.rotation.y = Math.atan2(direction.x, direction.z)
        plank.rotation.x = slopeAngle * Math.cos(plank.rotation.y)
        plank.rotation.z = -slopeAngle * Math.sin(plank.rotation.y)

        plank.castShadow = true
        plank.receiveShadow = true
        plank.userData = { interactive: true, category: 'bridge' }
        group.add(plank)
      }
    }

    const beamMat = new THREE.MeshStandardMaterial({
      color: woodColor || 0x7a5c10,
      roughness: 0.8,
      metalness: 0.05,
    })

    for (const side of [-1, 1]) {
      const beamGeo = new THREE.BoxGeometry(length, 0.2, 0.15)
      const beam = new THREE.Mesh(beamGeo, beamMat)
      const beamCenter = new THREE.Vector3().copy(start).addScaledVector(direction, length / 2)
      beam.position.set(beamCenter.x, start.y - 0.1, beamCenter.z)
      beam.position.addScaledVector(perpendicular, side * (width / 2 - 0.1))
      beam.rotation.y = Math.atan2(direction.x, direction.z)

      const midT = 0.5
      const midArch = Math.sin(midT * Math.PI) * 0.5
      beam.position.y = start.y - 0.1 + midArch

      beam.castShadow = true
      group.add(beam)
    }
  }

  _createBridgeRailings(group, start, direction, perpendicular, length, width, railingHeight, woodColor) {
    const railingMat = new THREE.MeshStandardMaterial({
      color: woodColor || 0x9a7520,
      roughness: 0.7,
      metalness: 0.05,
    })

    const postCount = 8
    const postSpacing = length / (postCount - 1)

    for (const side of [-1, 1]) {
      const offset = side * (width / 2 - 0.15)

      for (let i = 0; i < postCount; i++) {
        const t = i / (postCount - 1)
        const pos = new THREE.Vector3().copy(start).addScaledVector(direction, t * length)
        const archY = Math.sin(t * Math.PI) * 0.5

        const postGeo = new THREE.BoxGeometry(0.08, railingHeight, 0.08)
        const post = new THREE.Mesh(postGeo, railingMat)
        post.position.set(pos.x, start.y + archY + railingHeight / 2, pos.z)
        post.position.addScaledVector(perpendicular, offset)
        post.castShadow = true
        group.add(post)

        if (i < postCount - 1) {
          const nextT = (i + 1) / (postCount - 1)
          const nextPos = new THREE.Vector3().copy(start).addScaledVector(direction, nextT * length)
          const nextArchY = Math.sin(nextT * Math.PI) * 0.5

          const railGeo = new THREE.BoxGeometry(postSpacing + 0.05, 0.06, 0.06)
          const rail = new THREE.Mesh(railGeo, railingMat)
          const midPos = new THREE.Vector3().lerpVectors(pos, nextPos, 0.5)
          const midArch = (archY + nextArchY) / 2
          rail.position.set(midPos.x, start.y + midArch + railingHeight, midPos.z)
          rail.position.addScaledVector(perpendicular, offset)
          rail.rotation.y = Math.atan2(direction.x, direction.z)
          group.add(rail)

          const midRailGeo = new THREE.BoxGeometry(postSpacing + 0.05, 0.06, 0.06)
          const midRail = new THREE.Mesh(midRailGeo, railingMat)
          midRail.position.set(midPos.x, start.y + midArch + railingHeight * 0.5, midPos.z)
          midRail.position.addScaledVector(perpendicular, offset)
          midRail.rotation.y = Math.atan2(direction.x, direction.z)
          group.add(midRail)
        }
      }
    }
  }

  _createBridgeSupports(group, start, direction, perpendicular, length, width, supportColor) {
    const supportMat = new THREE.MeshStandardMaterial({
      color: supportColor || 0x5a4a2a,
      roughness: 0.85,
      metalness: 0.1,
    })

    const supportCount = 4
    for (let i = 0; i < supportCount; i++) {
      const t = (i + 0.5) / supportCount
      const pos = new THREE.Vector3().copy(start).addScaledVector(direction, t * length)
      const archY = Math.sin(t * Math.PI) * 0.5

      for (const side of [-1, 1]) {
        const offset = side * (width / 2 - 0.3)
        const supportHeight = start.y + archY + 0.3

        const postGeo = new THREE.CylinderGeometry(0.1, 0.15, supportHeight, 6)
        const post = new THREE.Mesh(postGeo, supportMat)
        post.position.set(pos.x, supportHeight / 2 - 0.3, pos.z)
        post.position.addScaledVector(perpendicular, offset)
        post.castShadow = true
        group.add(post)
      }

      const crossbarGeo = new THREE.CylinderGeometry(0.08, 0.08, width - 0.4, 6)
      const crossbar = new THREE.Mesh(crossbarGeo, supportMat)
      crossbar.position.set(pos.x, start.y + archY - 0.15, pos.z)
      crossbar.rotation.z = Math.PI / 2
      crossbar.rotation.y = Math.atan2(direction.x, direction.z)
      group.add(crossbar)
    }
  }

  createSwimmingArea({ id, center, size, orientation, depths, safety }) {
    const group = new THREE.Group()
    group.name = `swimmingArea_${id}`
    group.position.set(center[0], 0, center[1])
    group.rotation.y = orientation || 0
    group.userData = { interactive: true, landscapeId: id, category: 'swimmingArea' }

    this._createSwimmingBoundary(group, size)
    this._createDepthMarkers(group, size, depths)
    this._createSwimmingPlatform(group, size)
    this._createSafetyEquipment(group, size, safety)
    this._createWarningSigns(group, size, safety)

    this.landscapeGroup.add(group)
    return group
  }

  _createSwimmingBoundary(group, size) {
    const hw = size[0] / 2
    const hd = size[1] / 2
    const buoySpacing = 3
    const buoyMat = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      roughness: 0.4,
      metalness: 0.3,
    })
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xff6622,
      transparent: true,
      opacity: 0.8,
    })

    const buoyRadius = 0.2
    const buoyGeo = new THREE.SphereGeometry(buoyRadius, 8, 6)

    const boundaryPoints = [
      [-hw, -0.02, -hd],
      [hw, -0.02, -hd],
      [hw, -0.02, hd],
      [-hw, -0.02, hd],
    ]

    for (let side = 0; side < 4; side++) {
      const p1 = boundaryPoints[side]
      const p2 = boundaryPoints[(side + 1) % 4]
      const sidePoints = []

      const dx = p2[0] - p1[0]
      const dz = p2[2] - p1[2]
      const sideLength = Math.sqrt(dx * dx + dz * dz)
      const buoyCount = Math.ceil(sideLength / buoySpacing)

      for (let i = 0; i <= buoyCount; i++) {
        const t = i / buoyCount
        const x = p1[0] + dx * t
        const z = p1[2] + dz * t
        sidePoints.push(new THREE.Vector3(x, -0.02, z))

        const buoy = new THREE.Mesh(buoyGeo, buoyMat.clone())
        buoy.position.set(x, 0.05, z)
        buoy.scale.y = 0.7
        buoy.name = 'boundaryBuoy'
        buoy.userData = { isBuoy: true }
        group.add(buoy)
        this._animatedBuoys.push(buoy)
      }

      if (sidePoints.length > 1) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints(sidePoints)
        const line = new THREE.Line(lineGeo, lineMat)
        line.name = 'boundaryLine'
        group.add(line)
      }
    }
  }

  _createDepthMarkers(group, size, depths) {
    if (!depths || depths.length === 0) return

    const hw = size[0] / 2
    const hd = size[1] / 2

    for (const depth of depths) {
      const markerGroup = new THREE.Group()
      markerGroup.name = 'depthMarker'

      const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.0, 6)
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.5 })
      const pole = new THREE.Mesh(poleGeo, poleMat)
      pole.position.y = 1.0
      markerGroup.add(pole)

      const depthValue = depth.depth
      const panelHeight = 0.6
      const panelWidth = 0.8

      const panelGeo = new THREE.BoxGeometry(panelWidth, panelHeight, 0.05)
      const depthColor = depthValue <= 0.5 ? 0x22aa44 : depthValue <= 1.2 ? 0xddaa22 : 0xdd3333
      const panelMat = new THREE.MeshStandardMaterial({
        color: depthColor,
        roughness: 0.3,
        metalness: 0.2,
      })
      const panel = new THREE.Mesh(panelGeo, panelMat)
      panel.position.y = 1.7
      markerGroup.add(panel)

      const frameGeo = new THREE.BoxGeometry(panelWidth + 0.06, panelHeight + 0.06, 0.03)
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
      const frame = new THREE.Mesh(frameGeo, frameMat)
      frame.position.y = 1.7
      frame.position.z = 0.025
      markerGroup.add(frame)

      const topGeo = new THREE.ConeGeometry(0.15, 0.3, 6)
      const topMat = new THREE.MeshStandardMaterial({ color: depthColor })
      const topCap = new THREE.Mesh(topGeo, topMat)
      topCap.position.y = 2.15
      markerGroup.add(topCap)

      const pos = depth.position || [0, 0]
      markerGroup.position.set(pos[0], 0, pos[1])
      group.add(markerGroup)
    }
  }

  _createSwimmingPlatform(group, size) {
    const hw = size[0] / 2
    const hd = size[1] / 2
    const platformWidth = 3
    const platformDepth = 2

    const platformGeo = new THREE.BoxGeometry(platformWidth, 0.15, platformDepth)
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.75,
      metalness: 0.05,
    })
    const platform = new THREE.Mesh(platformGeo, platformMat)
    platform.position.set(0, 0.1, -hd - platformDepth / 2 + 0.5)
    platform.receiveShadow = true
    platform.castShadow = true
    platform.name = 'swimmingPlatform'
    group.add(platform)

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x9a8060,
      roughness: 0.7,
      metalness: 0.05,
    })

    for (let i = 0; i < 3; i++) {
      const stepGeo = new THREE.BoxGeometry(1.5, 0.12, 0.4)
      const step = new THREE.Mesh(stepGeo, stepMat)
      step.position.set(0, 0.05 - i * 0.12, -hd + 0.5 + i * 0.4)
      step.receiveShadow = true
      step.name = 'swimmingStep'
      group.add(step)
    }

    const ladderPoleMat = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.4, metalness: 0.6 })
    for (const side of [-0.6, 0.6]) {
      const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6)
      const pole = new THREE.Mesh(poleGeo, ladderPoleMat)
      pole.position.set(side, 0.3, -hd + 0.8)
      group.add(pole)
    }
  }

  _createSafetyEquipment(group, size, safety) {
    if (!safety) return

    const hw = size[0] / 2
    const hd = size[1] / 2
    const equipmentPositions = safety.equipmentPositions || [
      { pos: [-hw - 1, -hd], type: 'lifebuoy' },
      { pos: [hw + 1, -hd], type: 'lifebuoy' },
      { pos: [-hw - 1, hd], type: 'lifebuoy' },
      { pos: [hw + 1, hd], type: 'lifeguardChair' },
    ]

    for (const eq of equipmentPositions) {
      if (eq.type === 'lifebuoy') {
        this._createLifebuoy(group, eq.pos)
      } else if (eq.type === 'lifeguardChair') {
        this._createLifeguardChair(group, eq.pos)
      }
    }
  }

  _createLifebuoy(group, pos) {
    const buoyGroup = new THREE.Group()
    buoyGroup.name = 'lifebuoy'

    const standGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.8, 6)
    const standMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5, metalness: 0.4 })
    const stand = new THREE.Mesh(standGeo, standMat)
    stand.position.y = 0.9
    buoyGroup.add(stand)

    const hookGeo = new THREE.TorusGeometry(0.15, 0.02, 4, 8, Math.PI)
    const hookMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.6 })
    const hook = new THREE.Mesh(hookGeo, hookMat)
    hook.position.y = 1.85
    hook.rotation.z = Math.PI
    buoyGroup.add(hook)

    const ringGeo = new THREE.TorusGeometry(0.35, 0.1, 8, 16)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      roughness: 0.4,
      metalness: 0.2,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.y = 1.5
    ring.rotation.x = Math.PI / 2
    ring.name = 'lifebuoyRing'
    buoyGroup.add(ring)
    this._lifebuoyRings.push(ring)

    const stripeGeo = new THREE.TorusGeometry(0.35, 0.1, 8, 16, Math.PI / 2)
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.2,
    })
    const stripe = new THREE.Mesh(stripeGeo, stripeMat)
    stripe.position.y = 1.5
    stripe.rotation.x = Math.PI / 2
    buoyGroup.add(stripe)

    buoyGroup.position.set(pos[0], 0, pos[1])
    group.add(buoyGroup)
  }

  _createLifeguardChair(group, pos) {
    const chairGroup = new THREE.Group()
    chairGroup.name = 'lifeguardChair'

    const legMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.5 })

    const legPositions = [
      [-0.3, 0, -0.3],
      [0.3, 0, -0.3],
      [-0.35, 0, 0.3],
      [0.35, 0, 0.3],
    ]

    for (const lp of legPositions) {
      const legGeo = new THREE.CylinderGeometry(0.04, 0.05, 2.5, 6)
      const leg = new THREE.Mesh(legGeo, legMat)
      leg.position.set(lp[0], 1.25, lp[2])
      chairGroup.add(leg)
    }

    for (let i = 0; i < 5; i++) {
      const stepGeo = new THREE.BoxGeometry(0.5, 0.04, 0.25)
      const stepMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 })
      const step = new THREE.Mesh(stepGeo, stepMat)
      step.position.set(0, 0.4 + i * 0.45, 0.3 - i * 0.05)
      chairGroup.add(step)
    }

    const seatGeo = new THREE.BoxGeometry(0.7, 0.08, 0.5)
    const seatMat = new THREE.MeshStandardMaterial({ color: 0xf0e0c0, roughness: 0.7 })
    const seat = new THREE.Mesh(seatGeo, seatMat)
    seat.position.set(0, 2.5, 0)
    seat.castShadow = true
    chairGroup.add(seat)

    const backGeo = new THREE.BoxGeometry(0.7, 0.6, 0.06)
    const back = new THREE.Mesh(backGeo, seatMat)
    back.position.set(0, 2.8, -0.22)
    back.castShadow = true
    chairGroup.add(back)

    const umbrellaGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.05, 12)
    const umbrellaMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.4,
      side: THREE.DoubleSide,
    })
    const umbrella = new THREE.Mesh(umbrellaGeo, umbrellaMat)
    umbrella.position.set(0, 3.4, 0)
    chairGroup.add(umbrella)

    const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6)
    const pole = new THREE.Mesh(poleGeo, legMat)
    pole.position.set(0, 2.9, 0)
    chairGroup.add(pole)

    chairGroup.position.set(pos[0], 0, pos[1])
    group.add(chairGroup)
  }

  _createWarningSigns(group, size, safety) {
    if (!safety || !safety.warningSigns) return

    const hw = size[0] / 2
    const hd = size[1] / 2

    const signPositions = safety.warningSigns.positions || [
      { pos: [-hw - 2, -hd - 1], warning: 'depth' },
      { pos: [hw + 2, hd + 1], warning: 'noDiving' },
    ]

    for (const sign of signPositions) {
      this._createWarningSign(group, sign.pos, sign.warning)
    }
  }

  _createWarningSign(group, pos, warningType) {
    const signGroup = new THREE.Group()
    signGroup.name = `warningSign_${warningType}`

    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.5, metalness: 0.5 })
    const pole = new THREE.Mesh(poleGeo, poleMat)
    pole.position.y = 0.75
    signGroup.add(pole)

    const signWidth = 0.8
    const signHeight = 0.6
    const signGeo = new THREE.BoxGeometry(signWidth, signHeight, 0.04)
    const signColor = warningType === 'noDiving' ? 0xffcc00 : 0x4488ff
    const signMat = new THREE.MeshStandardMaterial({
      color: signColor,
      roughness: 0.3,
      metalness: 0.2,
    })
    const sign = new THREE.Mesh(signGeo, signMat)
    sign.position.y = 1.5
    signGroup.add(sign)

    const borderGeo = new THREE.BoxGeometry(signWidth + 0.06, signHeight + 0.06, 0.02)
    const borderMat = new THREE.MeshStandardMaterial({ color: 0xff2200, roughness: 0.4 })
    const border = new THREE.Mesh(borderGeo, borderMat)
    border.position.y = 1.5
    border.position.z = -0.01
    signGroup.add(border)

    const lightGeo = new THREE.SphereGeometry(0.08, 6, 4)
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
    })
    const light = new THREE.Mesh(lightGeo, lightMat)
    light.position.y = 1.85
    light.name = 'warningLight'
    signGroup.add(light)
    this._warningLights.push(light)

    signGroup.position.set(pos[0], 0, pos[1])
    group.add(signGroup)
  }

  updateAnimation(elapsed) {
    for (const mesh of this.waterMeshes) {
      if (!mesh.geometry || !mesh.geometry.attributes.position) continue
      const positions = mesh.geometry.attributes.position
      const baseYValues = mesh.userData.baseYValues

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const z = positions.getZ(i)
        const baseY = baseYValues ? baseYValues[i] : -0.05
        const wave = Math.sin(elapsed * 1.5 + x * 0.3) * 0.03
            + Math.sin(elapsed * 0.8 + z * 0.4) * 0.02
            + Math.cos(elapsed * 1.2 + x * 0.2 + z * 0.3) * 0.015
        positions.setY(i, baseY + wave)
      }
      positions.needsUpdate = true
    }

    for (const particle of this.circulationParticles) {
      if (!particle.userData.curve) continue
      let t = particle.userData.t + particle.userData.speed * 0.016
      if (t > 1) t -= 1
      particle.userData.t = t
      const point = particle.userData.curve.getPointAt(t)
      particle.position.copy(point)
      particle.position.y = 0.07 + Math.sin(elapsed * 2 + t * 10) * 0.02
    }

    for (const buoy of this._animatedBuoys) {
      buoy.position.y = 0.1 + Math.sin(elapsed * 1.5 + buoy.position.x * 0.5) * 0.03
    }

    for (const light of this._warningLights) {
      light.material.emissiveIntensity = 0.3 + Math.sin(elapsed * 3) * 0.3
    }

    for (const ring of this._circulationRings) {
      ring.rotation.z = elapsed * 1.5
    }

    for (const arrow of this._circulationArrows) {
      arrow.position.y = 0.3 + Math.sin(elapsed * 2) * 0.1
    }

    for (const ring of this._lifebuoyRings) {
      ring.rotation.z = Math.sin(elapsed * 0.8) * 0.1
    }
  }

  dispose() {
    this.waterMeshes = []
    this.circulationParticles = []
    this.landscapeGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
        else child.material.dispose()
      }
    })
    this.scene.remove(this.landscapeGroup)
  }
}
