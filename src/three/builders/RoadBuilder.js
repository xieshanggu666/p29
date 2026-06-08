import * as THREE from 'three'

export class RoadBuilder {
  constructor(scene) {
    this.scene = scene
    this.roadGroup = new THREE.Group()
    this.roadGroup.name = 'roads'
    this.scene.add(this.roadGroup)
  }

  buildFromConfig(config) {
    for (const item of config) {
      this.createRoad(item)
    }
  }

  createRoad({ id, name, path, width = 4, type = 'main', closed = false }) {
    const curve = new THREE.CatmullRomCurve3(
      path.map(p => new THREE.Vector3(p[0], 0.05, p[1])),
      closed
    )

    const roadMat = new THREE.MeshStandardMaterial({
      color: type === 'main' ? 0x333344 : 0x444455,
      roughness: 0.9,
      metalness: 0.0,
    })

    const roadGeo = this._createRoadGeometry(curve, width)
    const road = new THREE.Mesh(roadGeo, roadMat)
    road.receiveShadow = true
    road.name = `road_${id}`
    road.userData = { interactive: true, roadId: id, roadName: name, roadType: type }
    this.roadGroup.add(road)

    this._addRoadLines(curve, width, type)

    if (type === 'main') {
      this._addSidewalks(curve, width)
    }

    return road
  }

  _createRoadGeometry(curve, width) {
    const segments = 64
    const hw = width / 2
    const positions = []
    const normals = []
    const indices = []

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const point = curve.getPointAt(t)
      const tangent = curve.getTangentAt(t)
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()

      positions.push(
        point.x + normal.x * hw, point.y, point.z + normal.z * hw,
        point.x - normal.x * hw, point.y, point.z - normal.z * hw
      )
      normals.push(0, 1, 0, 0, 1, 0)
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2
      const b = a + 1
      const c = a + 2
      const d = a + 3
      indices.push(a, c, b, b, c, d)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geo.setIndex(indices)
    return geo
  }

  _addRoadLines(curve, width, type) {
    const segments = 64
    const dashMat = new THREE.LineDashedMaterial({
      color: 0xffff66,
      dashSize: type === 'main' ? 1.5 : 0.8,
      gapSize: type === 'main' ? 1.0 : 0.5,
      transparent: true,
      opacity: 0.7,
    })

    const centerPoints = []
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const p = curve.getPointAt(t)
      centerPoints.push(new THREE.Vector3(p.x, 0.08, p.z))
    }

    const lineGeo = new THREE.BufferGeometry().setFromPoints(centerPoints)
    const line = new THREE.Line(lineGeo, dashMat)
    line.computeLineDistances()
    this.roadGroup.add(line)

    if (type === 'main') {
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xaaaa44, transparent: true, opacity: 0.4 })
      const hw = width / 2 - 0.2

      for (const side of [-1, 1]) {
        const edgePoints = []
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const p = curve.getPointAt(t)
          const tan = curve.getTangentAt(t)
          const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize()
          edgePoints.push(new THREE.Vector3(p.x + n.x * hw * side, 0.08, p.z + n.z * hw * side))
        }
        const edgeGeo = new THREE.BufferGeometry().setFromPoints(edgePoints)
        this.roadGroup.add(new THREE.Line(edgeGeo, edgeMat))
      }
    }
  }

  _addSidewalks(curve, roadWidth) {
    const segments = 48
    const sidewalkWidth = 2
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x555566,
      roughness: 0.8,
      metalness: 0.0,
    })

    for (const side of [-1, 1]) {
      const positions = []
      const indices = []
      const offset = roadWidth / 2 + sidewalkWidth / 2

      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const p = curve.getPointAt(t)
        const tan = curve.getTangentAt(t)
        const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize()
        const cx = p.x + n.x * offset * side
        const cz = p.z + n.z * offset * side

        positions.push(
          cx + n.x * sidewalkWidth / 2, 0.15, cz + n.z * sidewalkWidth / 2,
          cx - n.x * sidewalkWidth / 2, 0.15, cz - n.z * sidewalkWidth / 2,
        )
      }

      for (let i = 0; i < segments; i++) {
        const a = i * 2
        const b = a + 1
        const c = a + 2
        const d = a + 3
        indices.push(a, c, b, b, c, d)
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geo.setIndex(indices)
      geo.computeVertexNormals()
      const mesh = new THREE.Mesh(geo, sidewalkMat)
      mesh.receiveShadow = true
      this.roadGroup.add(mesh)
    }
  }

  dispose() {
    this.roadGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
        else child.material.dispose()
      }
    })
    this.scene.remove(this.roadGroup)
  }
}
