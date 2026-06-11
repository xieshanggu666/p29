import * as THREE from 'three'

const LOD_DISTANCES = { high: 30, medium: 60, low: 100 }
const FRUSTUM_CHECK_INTERVAL = 500

export class PedestrianBuilder {
  constructor(parentGroup, camera) {
    this.parentGroup = parentGroup
    this.camera = camera
    this.pedestrianGroup = new THREE.Group()
    this.pedestrianGroup.name = 'pedestrians'
    this.parentGroup.add(this.pedestrianGroup)

    this.pedestrians = []
    this._frustum = new THREE.Frustum()
    this._projScreenMatrix = new THREE.Matrix4()
    this._lastFrustumCheck = 0

    this._highGeo = this._createHighDetailGeometry()
    this._mediumGeo = this._createMediumDetailGeometry()
    this._lowGeo = this._createLowDetailGeometry()
    this._sharedMaterials = this._createSharedMaterials()
  }

  buildFromConfig(config) {
    if (!config.pedestrians) return
    for (const item of config.pedestrians) {
      this.createPedestrian(item)
    }
  }

  createPedestrian({ id, path, speed = 1, color = 0x334455, closed = false }) {
    const group = new THREE.Group()
    group.name = `pedestrian_${id}`
    group.userData = {
      interactive: true,
      pedestrianId: id,
      category: 'pedestrian',
    }

    const skinColors = [0xf5d0a9, 0xd4a574, 0x8d5524, 0xc68642, 0xe0ac69, 0xf1c27d]
    const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)]
    const hairColors = [0x1a1a1a, 0x3d2314, 0x5c3a21, 0x8b6914, 0x9a7b4f, 0xc0c0c0]
    const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)]
    const pantColors = [0x222244, 0x2f4f4f, 0x3d3d3d, 0x4a3728, 0x1a1a2e]
    const pantColor = pantColors[Math.floor(Math.random() * pantColors.length)]
    const shoeColors = [0x1a1a1a, 0x2d2d2d, 0x4a3728, 0x5c4033]
    const shoeColor = shoeColors[Math.floor(Math.random() * shoeColors.length)]

    const materials = {
      body: this._sharedMaterials.body.clone(),
      skin: this._sharedMaterials.skin.clone(),
      hair: this._sharedMaterials.hair.clone(),
      pants: this._sharedMaterials.pants.clone(),
      shoe: this._sharedMaterials.shoe.clone(),
      eye: this._sharedMaterials.eye.clone(),
      iris: this._sharedMaterials.iris.clone(),
      pupil: this._sharedMaterials.pupil.clone(),
      nail: this._sharedMaterials.nail.clone(),
      nose: this._sharedMaterials.skin.clone(),
      mouth: this._sharedMaterials.mouth.clone(),
      button: this._sharedMaterials.button.clone(),
      collar: this._sharedMaterials.collar.clone(),
      belt: this._sharedMaterials.belt.clone(),
    }

    const irisColors = [0x4a6741, 0x5c4033, 0x1a1a2e, 0x3d6b8e, 0x6b5b3d, 0x2e5a4a]
    materials.body.color.setHex(color)
    materials.skin.color.setHex(skinColor)
    materials.hair.color.setHex(hairColor)
    materials.pants.color.setHex(pantColor)
    materials.shoe.color.setHex(shoeColor)
    materials.iris.color.setHex(irisColors[Math.floor(Math.random() * irisColors.length)])

    const lod = new THREE.LOD()
    lod.name = 'lod'

    const highDetail = this._buildHighDetail(materials)
    highDetail.visible = true
    lod.addLevel(highDetail, 0)

    const mediumDetail = this._buildMediumDetail(materials)
    mediumDetail.visible = false
    lod.addLevel(mediumDetail, LOD_DISTANCES.high)

    const lowDetail = this._buildLowDetail(materials)
    lowDetail.visible = false
    lod.addLevel(lowDetail, LOD_DISTANCES.medium)

    group.add(lod)

    const curve = new THREE.CatmullRomCurve3(
      path.map(p => new THREE.Vector3(p[0], 0, p[1])),
      closed
    )

    const bodyParts = this._getBodyParts(highDetail)

    const pedData = {
      group,
      lod,
      curve,
      speed,
      progress: Math.random(),
      direction: 1,
      closed,
      ...bodyParts,
      walkPhase: Math.random() * Math.PI * 2,
      bobPhase: Math.random() * Math.PI * 2,
      headBobPhase: Math.random() * Math.PI * 2,
      handPhase: Math.random() * Math.PI * 2,
      idleTimer: Math.random() * 5,
      isIdle: false,
      idleDuration: 2 + Math.random() * 3,
      walkDuration: 4 + Math.random() * 6,
      boundingSphere: new THREE.Sphere(new THREE.Vector3(), 1.8),
      visible: true,
      highDetail,
      mediumDetail,
      lowDetail,
      isWaitingForCar: false,
      waitSpeedFactor: 1,
    }

    this.pedestrians.push(pedData)
    this.pedestrianGroup.add(group)
    return group
  }

  _getBodyParts(highDetail) {
    return {
      torso: highDetail.getObjectByName('torso'),
      head: highDetail.getObjectByName('head'),
      neck: highDetail.getObjectByName('neck'),
      leftLeg: highDetail.getObjectByName('leftLeg'),
      rightLeg: highDetail.getObjectByName('rightLeg'),
      leftCalf: highDetail.getObjectByName('leftCalf'),
      rightCalf: highDetail.getObjectByName('rightCalf'),
      leftArm: highDetail.getObjectByName('leftArm'),
      rightArm: highDetail.getObjectByName('rightArm'),
      leftForearm: highDetail.getObjectByName('leftForearm'),
      rightForearm: highDetail.getObjectByName('rightForearm'),
      leftHand: highDetail.getObjectByName('leftHand'),
      rightHand: highDetail.getObjectByName('rightHand'),
      leftFoot: highDetail.getObjectByName('leftFoot'),
      rightFoot: highDetail.getObjectByName('rightFoot'),
      leftHandFingers: this._getFingers(highDetail, 'leftFinger'),
      rightHandFingers: this._getFingers(highDetail, 'rightFinger'),
      neckMuscles: [
        highDetail.getObjectByName('leftSternocleidomastoid'),
        highDetail.getObjectByName('rightSternocleidomastoid'),
        highDetail.getObjectByName('trapezius'),
      ],
    }
  }

  _getFingers(root, prefix) {
    const fingers = []
    for (let i = 0; i < 5; i++) {
      const finger = []
      for (let j = 0; j < 3; j++) {
        const bone = root.getObjectByName(`${prefix}_${i}_${j}`)
        if (bone) finger.push(bone)
      }
      if (finger.length > 0) fingers.push(finger)
    }
    return fingers
  }

  _createSharedMaterials() {
    return {
      body: new THREE.MeshPhysicalMaterial({
        roughness: 0.65,
        metalness: 0.05,
        sheen: 0.1,
        sheenColor: new THREE.Color(0x888888),
      }),
      skin: new THREE.MeshPhysicalMaterial({
        roughness: 0.35,
        metalness: 0.0,
        clearcoat: 0.15,
        clearcoatRoughness: 0.6,
        sheen: 0.2,
        sheenColor: new THREE.Color(0xffccaa),
        thickness: 0.5,
        transmission: 0.02,
      }),
      hair: new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.0 }),
      pants: new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.0 }),
      shoe: new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.1 }),
      eye: new THREE.MeshPhysicalMaterial({
        color: 0xf0f0f0,
        roughness: 0.15,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      }),
      iris: new THREE.MeshPhysicalMaterial({
        color: 0x4a6741,
        roughness: 0.3,
        metalness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
      }),
      pupil: new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        roughness: 0.1,
        metalness: 0.3,
      }),
      nail: new THREE.MeshPhysicalMaterial({
        color: 0xffe4c4,
        roughness: 0.2,
        metalness: 0.0,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
      }),
      mouth: new THREE.MeshStandardMaterial({ color: 0x8b3a3a, roughness: 0.5 }),
      button: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.6 }),
      collar: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
      belt: new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.5, metalness: 0.1 }),
    }
  }

  _createHighDetailGeometry() {
    const headGeo = (() => {
      const geo = new THREE.SphereGeometry(0.15, 28, 22)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const z = pos.getZ(i)
        if (z > 0.05) {
          const chinTuck = y < -0.05 ? (y + 0.05) * 0.3 : 0
          pos.setZ(i, z - chinTuck * 0.5)
        }
        if (y < -0.1 && z > 0) {
          pos.setY(i, y + (z - 0) * 0.08)
        }
      }
      geo.computeVertexNormals()
      return geo
    })()

    const torsoGeo = (() => {
      const geo = new THREE.CapsuleGeometry(0.14, 0.3, 8, 16)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const z = pos.getZ(i)
        const r = Math.sqrt(x * x + z * z)
        if (y > 0.1 && r > 0.01) {
          const taper = 1 - (y - 0.1) * 0.2
          pos.setX(i, x * taper)
          pos.setZ(i, z * taper)
        }
        if (y < -0.1 && r > 0.01) {
          const flare = 1 + (-y - 0.1) * 0.15
          pos.setX(i, x * flare)
          pos.setZ(i, z * flare)
        }
      }
      geo.computeVertexNormals()
      return geo
    })()

    const neckSegmentGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.035, 12)
    const neckTopGeo = new THREE.CylinderGeometry(0.05, 0.055, 0.025, 12)

    const sternocleidomastoidGeo = new THREE.CapsuleGeometry(0.018, 0.1, 4, 8)
    const trapeziusGeo = new THREE.CapsuleGeometry(0.06, 0.15, 4, 8)

    const shoulderGeo = new THREE.SphereGeometry(0.055, 10, 8)
    const upperArmGeo = new THREE.CapsuleGeometry(0.04, 0.16, 4, 10)
    const forearmGeo = new THREE.CapsuleGeometry(0.032, 0.16, 4, 10)
    const elbowGeo = new THREE.SphereGeometry(0.038, 8, 6)

    const handGeo = (() => {
      const geo = new THREE.CapsuleGeometry(0.028, 0.04, 4, 8)
      geo.scale(1.4, 1, 1.8)
      geo.computeVertexNormals()
      return geo
    })()

    const fingerProximalGeo = new THREE.CapsuleGeometry(0.008, 0.025, 3, 6)
    const fingerMiddleGeo = new THREE.CapsuleGeometry(0.007, 0.02, 3, 6)
    const fingerDistalGeo = new THREE.CapsuleGeometry(0.006, 0.016, 3, 6)
    const nailGeo = new THREE.BoxGeometry(0.008, 0.002, 0.012)

    const hipGeo = new THREE.SphereGeometry(0.065, 10, 8)
    const thighGeo = new THREE.CapsuleGeometry(0.055, 0.18, 6, 10)
    const kneeGeo = new THREE.SphereGeometry(0.045, 8, 6)
    const calfGeo = new THREE.CapsuleGeometry(0.04, 0.18, 4, 10)

    const footGeo = (() => {
      const geo = new THREE.CapsuleGeometry(0.035, 0.06, 4, 8)
      geo.scale(1.4, 0.8, 2.2)
      geo.computeVertexNormals()
      return geo
    })()

    const eyeGeo = (() => {
      const geo = new THREE.SphereGeometry(0.022, 12, 8)
      geo.scale(1, 0.7, 0.5)
      geo.computeVertexNormals()
      return geo
    })()

    const irisGeo = new THREE.SphereGeometry(0.013, 10, 8)
    const pupilGeo = new THREE.SphereGeometry(0.007, 8, 6)

    const mouthGeo = (() => {
      const geo = new THREE.CapsuleGeometry(0.008, 0.022, 4, 8)
      geo.scale(1, 0.5, 0.5)
      geo.computeVertexNormals()
      return geo
    })()

    const noseGeo = (() => {
      const geo = new THREE.CapsuleGeometry(0.012, 0.02, 4, 6)
      geo.scale(0.8, 1, 1.2)
      geo.computeVertexNormals()
      return geo
    })()

    const earGeo = (() => {
      const geo = new THREE.CapsuleGeometry(0.015, 0.025, 3, 6)
      geo.scale(0.5, 1, 0.8)
      geo.computeVertexNormals()
      return geo
    })()

    const collarGeo = new THREE.TorusGeometry(0.12, 0.025, 8, 16)
    const beltGeo = new THREE.BoxGeometry(0.4, 0.04, 0.04)
    const buttonGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 8)
    const hairGeo = (() => {
      const geo = new THREE.SphereGeometry(0.155, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const z = pos.getZ(i)
        const r = Math.sqrt(x * x + z * z)
        if (r > 0.01) {
          const noise = Math.sin(x * 30) * 0.003 + Math.cos(z * 25) * 0.003
          pos.setX(i, x * (1 + noise))
          pos.setZ(i, z * (1 + noise))
        }
      }
      geo.computeVertexNormals()
      return geo
    })()

    return {
      head: headGeo,
      torso: torsoGeo,
      neckSegment: neckSegmentGeo,
      neckTop: neckTopGeo,
      sternocleidomastoid: sternocleidomastoidGeo,
      trapezius: trapeziusGeo,
      shoulder: shoulderGeo,
      upperArm: upperArmGeo,
      forearm: forearmGeo,
      elbow: elbowGeo,
      hand: handGeo,
      fingerProximal: fingerProximalGeo,
      fingerMiddle: fingerMiddleGeo,
      fingerDistal: fingerDistalGeo,
      nail: nailGeo,
      hip: hipGeo,
      thigh: thighGeo,
      knee: kneeGeo,
      calf: calfGeo,
      foot: footGeo,
      eye: eyeGeo,
      iris: irisGeo,
      pupil: pupilGeo,
      mouth: mouthGeo,
      nose: noseGeo,
      ear: earGeo,
      collar: collarGeo,
      belt: beltGeo,
      button: buttonGeo,
      hair: hairGeo,
    }
  }

  _createMediumDetailGeometry() {
    return {
      head: new THREE.SphereGeometry(0.15, 20, 16),
      torso: new THREE.CapsuleGeometry(0.14, 0.3, 6, 12),
      neck: new THREE.CylinderGeometry(0.055, 0.065, 0.06, 8),
      shoulder: new THREE.SphereGeometry(0.05, 8, 6),
      arm: new THREE.CapsuleGeometry(0.035, 0.4, 4, 8),
      hand: new THREE.CapsuleGeometry(0.025, 0.03, 4, 6),
      hip: new THREE.SphereGeometry(0.055, 8, 6),
      leg: new THREE.CapsuleGeometry(0.045, 0.5, 4, 8),
      foot: new THREE.CapsuleGeometry(0.03, 0.05, 4, 6),
      eye: new THREE.SphereGeometry(0.018, 8, 6),
      iris: new THREE.SphereGeometry(0.011, 6, 6),
      mouth: new THREE.CapsuleGeometry(0.006, 0.02, 3, 6),
      nose: new THREE.CapsuleGeometry(0.01, 0.015, 3, 6),
      ear: new THREE.CapsuleGeometry(0.012, 0.02, 3, 4),
      collar: new THREE.TorusGeometry(0.12, 0.025, 6, 12),
      belt: new THREE.BoxGeometry(0.4, 0.04, 0.04),
      button: new THREE.CylinderGeometry(0.015, 0.015, 0.01, 6),
      hair: new THREE.SphereGeometry(0.155, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    }
  }

  _createLowDetailGeometry() {
    return {
      head: new THREE.SphereGeometry(0.15, 10, 8),
      torso: new THREE.CapsuleGeometry(0.14, 0.3, 4, 8),
      neck: new THREE.CylinderGeometry(0.055, 0.065, 0.06, 6),
      arm: new THREE.CapsuleGeometry(0.035, 0.4, 3, 6),
      hand: new THREE.SphereGeometry(0.03, 6, 4),
      leg: new THREE.CapsuleGeometry(0.045, 0.5, 3, 6),
      foot: new THREE.CapsuleGeometry(0.03, 0.05, 3, 4),
      hair: new THREE.SphereGeometry(0.155, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    }
  }

  _buildHighDetail(materials) {
    const group = new THREE.Group()
    group.name = 'highDetail'

    const pelvis = new THREE.Group()
    pelvis.position.y = 0.72
    pelvis.name = 'pelvis'
    group.add(pelvis)

    const torso = new THREE.Mesh(this._highGeo.torso, materials.body)
    torso.position.y = 0.275
    torso.name = 'torso'
    torso.castShadow = true
    pelvis.add(torso)

    const neckGroup = this._buildNeck(materials)
    neckGroup.position.y = 0.275
    torso.add(neckGroup)

    const headGroup = new THREE.Group()
    headGroup.position.y = 0.1
    headGroup.name = 'headGroup'
    neckGroup.add(headGroup)

    const head = new THREE.Mesh(this._highGeo.head, materials.skin)
    head.position.y = 0.15
    head.name = 'head'
    head.castShadow = true
    headGroup.add(head)

    this._buildFacialFeatures(headGroup, materials)

    const hair = new THREE.Mesh(this._highGeo.hair, materials.hair)
    hair.position.y = 0.15
    hair.castShadow = true
    headGroup.add(hair)

    const leftEar = new THREE.Mesh(this._highGeo.ear, materials.skin)
    leftEar.position.set(-0.14, 0.14, 0)
    leftEar.rotation.z = -0.2
    leftEar.castShadow = true
    headGroup.add(leftEar)

    const rightEar = new THREE.Mesh(this._highGeo.ear, materials.skin)
    rightEar.position.set(0.14, 0.14, 0)
    rightEar.rotation.z = 0.2
    rightEar.castShadow = true
    headGroup.add(rightEar)

    this._buildClothing(pelvis, torso, materials)
    this._buildLegs(pelvis, materials)
    this._buildArmsAndHands(torso, materials)

    return group
  }

  _buildNeck(materials) {
    const neckGroup = new THREE.Group()
    neckGroup.name = 'neck'

    const neckCurvePoints = []
    for (let i = 0; i < 4; i++) {
      const t = i / 3
      const y = t * 0.08
      const x = Math.sin(t * Math.PI * 0.4) * 0.008
      neckCurvePoints.push(new THREE.Vector3(x, y, 0))
    }
    const neckCurve = new THREE.CatmullRomCurve3(neckCurvePoints)

    for (let i = 0; i < 2; i++) {
      const segment = new THREE.Mesh(this._highGeo.neckSegment, materials.skin)
      const point = neckCurve.getPointAt(i / 2)
      segment.position.copy(point)
      segment.rotation.z = Math.sin(i / 2 * Math.PI * 0.4) * 0.1
      segment.castShadow = true
      neckGroup.add(segment)
    }

    const neckTop = new THREE.Mesh(this._highGeo.neckTop, materials.skin)
    neckTop.position.copy(neckCurve.getPointAt(1))
    neckTop.castShadow = true
    neckGroup.add(neckTop)

    const leftSCM = new THREE.Mesh(this._highGeo.sternocleidomastoid, materials.skin)
    leftSCM.position.set(-0.045, 0.03, 0.03)
    leftSCM.rotation.set(-0.3, 0, -0.5)
    leftSCM.name = 'leftSternocleidomastoid'
    leftSCM.castShadow = true
    neckGroup.add(leftSCM)

    const rightSCM = new THREE.Mesh(this._highGeo.sternocleidomastoid, materials.skin)
    rightSCM.position.set(0.045, 0.03, 0.03)
    rightSCM.rotation.set(-0.3, 0, 0.5)
    rightSCM.name = 'rightSternocleidomastoid'
    rightSCM.castShadow = true
    neckGroup.add(rightSCM)

    const trapezius = new THREE.Mesh(this._highGeo.trapezius, materials.skin)
    trapezius.position.set(0, -0.01, -0.02)
    trapezius.rotation.x = 0.15
    trapezius.name = 'trapezius'
    trapezius.castShadow = true
    neckGroup.add(trapezius)

    return neckGroup
  }

  _buildFacialFeatures(headGroup, materials) {
    const headRadius = 0.15
    const headCenterY = 0.15

    const leftEyeX = -0.045
    const rightEyeX = 0.045
    const eyeY = headCenterY + 0.025

    const leftEyeZ = Math.sqrt(Math.max(0.001, headRadius * headRadius - leftEyeX * leftEyeX - (eyeY - headCenterY) * (eyeY - headCenterY)))
    const rightEyeZ = leftEyeZ

    const leftEye = new THREE.Mesh(this._highGeo.eye, materials.eye)
    leftEye.position.set(leftEyeX, eyeY, leftEyeZ + 0.005)
    headGroup.add(leftEye)

    const leftIris = new THREE.Mesh(this._highGeo.iris, materials.iris)
    leftIris.position.set(leftEyeX, eyeY, leftEyeZ + 0.01)
    headGroup.add(leftIris)

    const leftPupil = new THREE.Mesh(this._highGeo.pupil, materials.pupil)
    leftPupil.position.set(leftEyeX, eyeY, leftEyeZ + 0.013)
    headGroup.add(leftPupil)

    const rightEye = new THREE.Mesh(this._highGeo.eye, materials.eye)
    rightEye.position.set(rightEyeX, eyeY, rightEyeZ + 0.005)
    headGroup.add(rightEye)

    const rightIris = new THREE.Mesh(this._highGeo.iris, materials.iris)
    rightIris.position.set(rightEyeX, eyeY, rightEyeZ + 0.01)
    headGroup.add(rightIris)

    const rightPupil = new THREE.Mesh(this._highGeo.pupil, materials.pupil)
    rightPupil.position.set(rightEyeX, eyeY, rightEyeZ + 0.013)
    headGroup.add(rightPupil)

    const noseY = headCenterY - 0.02
    const noseZ = Math.sqrt(Math.max(0.001, headRadius * headRadius - (noseY - headCenterY) * (noseY - headCenterY)))

    const nose = new THREE.Mesh(this._highGeo.nose, materials.nose)
    nose.position.set(0, noseY, noseZ + 0.008)
    nose.rotation.x = Math.PI / 2
    headGroup.add(nose)

    const mouthY = headCenterY - 0.06
    const mouthZ = Math.sqrt(Math.max(0.001, headRadius * headRadius - (mouthY - headCenterY) * (mouthY - headCenterY)))

    const mouth = new THREE.Mesh(this._highGeo.mouth, materials.mouth)
    mouth.position.set(0, mouthY, mouthZ + 0.003)
    headGroup.add(mouth)

    const browY = eyeY + 0.025
    const browZ = Math.sqrt(Math.max(0.001, headRadius * headRadius - leftEyeX * leftEyeX - (browY - headCenterY) * (browY - headCenterY)))

    const leftBrowGeo = new THREE.CapsuleGeometry(0.004, 0.035, 3, 6)
    leftBrowGeo.rotateZ(0.15)
    const leftBrow = new THREE.Mesh(leftBrowGeo, materials.hair)
    leftBrow.position.set(leftEyeX, browY, browZ + 0.005)
    headGroup.add(leftBrow)

    const rightBrowGeo = new THREE.CapsuleGeometry(0.004, 0.035, 3, 6)
    rightBrowGeo.rotateZ(-0.15)
    const rightBrow = new THREE.Mesh(rightBrowGeo, materials.hair)
    rightBrow.position.set(rightEyeX, browY, browZ + 0.005)
    headGroup.add(rightBrow)
  }

  _buildClothing(pelvis, torso, materials) {
    const collar = new THREE.Mesh(this._highGeo.collar, materials.collar)
    collar.position.y = 0.26
    collar.rotation.x = Math.PI / 2
    collar.castShadow = true
    torso.add(collar)

    const belt = new THREE.Mesh(this._highGeo.belt, materials.belt)
    belt.position.y = 0.03
    belt.castShadow = true
    pelvis.add(belt)

    for (let i = 0; i < 3; i++) {
      const button = new THREE.Mesh(this._highGeo.button, materials.button)
      button.position.set(0, 0.18 - i * 0.1, 0.115)
      button.rotation.x = Math.PI / 2
      button.castShadow = true
      torso.add(button)
    }
  }

  _buildLegs(pelvis, materials) {
    const leftLeg = new THREE.Group()
    leftLeg.position.set(-0.1, -0.05, 0)
    leftLeg.name = 'leftLeg'
    pelvis.add(leftLeg)

    const leftHip = new THREE.Mesh(this._highGeo.hip, materials.pants)
    leftHip.castShadow = true
    leftLeg.add(leftHip)

    const leftThigh = new THREE.Mesh(this._highGeo.thigh, materials.pants)
    leftThigh.position.y = -0.14
    leftThigh.castShadow = true
    leftLeg.add(leftThigh)

    const leftCalf = new THREE.Group()
    leftCalf.position.y = -0.28
    leftCalf.name = 'leftCalf'
    leftLeg.add(leftCalf)

    const leftKnee = new THREE.Mesh(this._highGeo.knee, materials.pants)
    leftKnee.castShadow = true
    leftCalf.add(leftKnee)

    const leftCalfMesh = new THREE.Mesh(this._highGeo.calf, materials.pants)
    leftCalfMesh.position.y = -0.14
    leftCalfMesh.castShadow = true
    leftCalf.add(leftCalfMesh)

    const leftFoot = new THREE.Mesh(this._highGeo.foot, materials.shoe)
    leftFoot.position.set(0, -0.28, 0.03)
    leftFoot.name = 'leftFoot'
    leftFoot.castShadow = true
    leftCalf.add(leftFoot)

    const rightLeg = new THREE.Group()
    rightLeg.position.set(0.1, -0.05, 0)
    rightLeg.name = 'rightLeg'
    pelvis.add(rightLeg)

    const rightHip = new THREE.Mesh(this._highGeo.hip, materials.pants)
    rightHip.castShadow = true
    rightLeg.add(rightHip)

    const rightThigh = new THREE.Mesh(this._highGeo.thigh, materials.pants)
    rightThigh.position.y = -0.14
    rightThigh.castShadow = true
    rightLeg.add(rightThigh)

    const rightCalf = new THREE.Group()
    rightCalf.position.y = -0.28
    rightCalf.name = 'rightCalf'
    rightLeg.add(rightCalf)

    const rightKnee = new THREE.Mesh(this._highGeo.knee, materials.pants)
    rightKnee.castShadow = true
    rightCalf.add(rightKnee)

    const rightCalfMesh = new THREE.Mesh(this._highGeo.calf, materials.pants)
    rightCalfMesh.position.y = -0.14
    rightCalfMesh.castShadow = true
    rightCalf.add(rightCalfMesh)

    const rightFoot = new THREE.Mesh(this._highGeo.foot, materials.shoe)
    rightFoot.position.set(0, -0.28, 0.03)
    rightFoot.name = 'rightFoot'
    rightFoot.castShadow = true
    rightCalf.add(rightFoot)
  }

  _buildArmsAndHands(torso, materials) {
    const leftArm = new THREE.Group()
    leftArm.position.set(-0.22, 0.22, 0)
    leftArm.name = 'leftArm'
    torso.add(leftArm)

    const leftShoulder = new THREE.Mesh(this._highGeo.shoulder, materials.body)
    leftShoulder.castShadow = true
    leftArm.add(leftShoulder)

    const leftUpperArm = new THREE.Mesh(this._highGeo.upperArm, materials.body)
    leftUpperArm.position.y = -0.12
    leftUpperArm.castShadow = true
    leftArm.add(leftUpperArm)

    const leftForearm = new THREE.Group()
    leftForearm.position.y = -0.24
    leftForearm.name = 'leftForearm'
    leftArm.add(leftForearm)

    const leftElbow = new THREE.Mesh(this._highGeo.elbow, materials.body)
    leftElbow.castShadow = true
    leftForearm.add(leftElbow)

    const leftForearmMesh = new THREE.Mesh(this._highGeo.forearm, materials.body)
    leftForearmMesh.position.y = -0.12
    leftForearmMesh.castShadow = true
    leftForearm.add(leftForearmMesh)

    const leftHand = this._buildHand('left', materials)
    leftHand.position.set(0, -0.24, 0)
    leftHand.name = 'leftHand'
    leftForearm.add(leftHand)

    const rightArm = new THREE.Group()
    rightArm.position.set(0.22, 0.22, 0)
    rightArm.name = 'rightArm'
    torso.add(rightArm)

    const rightShoulder = new THREE.Mesh(this._highGeo.shoulder, materials.body)
    rightShoulder.castShadow = true
    rightArm.add(rightShoulder)

    const rightUpperArm = new THREE.Mesh(this._highGeo.upperArm, materials.body)
    rightUpperArm.position.y = -0.12
    rightUpperArm.castShadow = true
    rightArm.add(rightUpperArm)

    const rightForearm = new THREE.Group()
    rightForearm.position.y = -0.24
    rightForearm.name = 'rightForearm'
    rightArm.add(rightForearm)

    const rightElbow = new THREE.Mesh(this._highGeo.elbow, materials.body)
    rightElbow.castShadow = true
    rightForearm.add(rightElbow)

    const rightForearmMesh = new THREE.Mesh(this._highGeo.forearm, materials.body)
    rightForearmMesh.position.y = -0.12
    rightForearmMesh.castShadow = true
    rightForearm.add(rightForearmMesh)

    const rightHand = this._buildHand('right', materials)
    rightHand.position.set(0, -0.24, 0)
    rightHand.name = 'rightHand'
    rightForearm.add(rightHand)
  }

  _buildHand(side, materials) {
    const handGroup = new THREE.Group()
    handGroup.name = `${side}Hand`

    const palm = new THREE.Mesh(this._highGeo.hand, materials.skin)
    palm.castShadow = true
    handGroup.add(palm)

    const fingerBases = [
      { x: -0.03, z: 0.045 },
      { x: -0.01, z: 0.05 },
      { x: 0.01, z: 0.05 },
      { x: 0.03, z: 0.045 },
      { x: -0.045, z: 0.025 },
    ]

    const fingerLengths = [1.0, 1.15, 1.1, 0.95, 0.75]
    const sideMultiplier = side === 'left' ? 1 : -1

    for (let f = 0; f < 5; f++) {
      const fingerGroup = new THREE.Group()
      fingerGroup.name = `${side}Finger_${f}`

      const base = fingerBases[f]
      const lengthMul = fingerLengths[f]
      const spreadAngle = (f - 2) * 0.12 * sideMultiplier

      const proximal = new THREE.Mesh(this._highGeo.fingerProximal, materials.skin)
      proximal.scale.y = lengthMul
      proximal.position.set(0, 0.02 * lengthMul, 0)
      proximal.name = `${side}Finger_${f}_0`
      proximal.castShadow = true
      fingerGroup.add(proximal)

      const middle = new THREE.Mesh(this._highGeo.fingerMiddle, materials.skin)
      middle.scale.y = lengthMul
      middle.position.set(0, 0.052 * lengthMul, 0)
      middle.name = `${side}Finger_${f}_1`
      middle.castShadow = true
      fingerGroup.add(middle)

      const distal = new THREE.Mesh(this._highGeo.fingerDistal, materials.skin)
      distal.scale.y = lengthMul
      distal.position.set(0, 0.082 * lengthMul, 0)
      distal.name = `${side}Finger_${f}_2`
      distal.castShadow = true
      fingerGroup.add(distal)

      const nail = new THREE.Mesh(this._highGeo.nail, materials.nail)
      nail.position.set(0, 0.095 * lengthMul, 0.006)
      nail.rotation.x = -0.2
      nail.castShadow = true
      fingerGroup.add(nail)

      fingerGroup.position.set(base.x * sideMultiplier, 0, base.z)
      fingerGroup.rotation.y = spreadAngle
      fingerGroup.rotation.x = -0.3

      handGroup.add(fingerGroup)
    }

    const palmLineGeo = new THREE.BufferGeometry()
    const palmLinePositions = new Float32Array([
      -0.02, 0.016, 0.03,
      0.02, 0.016, 0.03,
      -0.015, 0.016, 0.01,
      0.015, 0.016, 0.01,
    ])
    palmLineGeo.setAttribute('position', new THREE.BufferAttribute(palmLinePositions, 3))
    const palmLineMat = new THREE.LineBasicMaterial({ color: 0xd4a574, transparent: true, opacity: 0.4 })
    const palmLines = new THREE.LineSegments(palmLineGeo, palmLineMat)
    handGroup.add(palmLines)

    return handGroup
  }

  _buildMediumDetail(materials) {
    const group = new THREE.Group()
    group.name = 'mediumDetail'

    const pelvis = new THREE.Group()
    pelvis.position.y = 0.72
    group.add(pelvis)

    const torso = new THREE.Mesh(this._mediumGeo.torso, materials.body)
    torso.position.y = 0.275
    torso.name = 'torso'
    torso.castShadow = true
    pelvis.add(torso)

    const neck = new THREE.Mesh(this._mediumGeo.neck, materials.skin)
    neck.position.y = 0.275
    neck.name = 'neck'
    neck.castShadow = true
    torso.add(neck)

    const head = new THREE.Mesh(this._mediumGeo.head, materials.skin)
    head.position.y = 0.1
    head.name = 'head'
    head.castShadow = true
    neck.add(head)

    const hair = new THREE.Mesh(this._mediumGeo.hair, materials.hair)
    hair.position.y = 0.05
    hair.castShadow = true
    head.add(hair)

    const headCenterY = 0.05
    const headRadius = 0.15
    const eyeY = headCenterY + 0.025
    const eyeX = 0.045
    const eyeZ = Math.sqrt(Math.max(0.001, headRadius * headRadius - eyeX * eyeX - 0.025 * 0.025))

    const leftEye = new THREE.Mesh(this._mediumGeo.eye, materials.eye)
    leftEye.position.set(-eyeX, eyeY, eyeZ + 0.005)
    head.add(leftEye)

    const leftIris = new THREE.Mesh(this._mediumGeo.iris, materials.iris)
    leftIris.position.set(-eyeX, eyeY, eyeZ + 0.008)
    head.add(leftIris)

    const rightEye = new THREE.Mesh(this._mediumGeo.eye, materials.eye)
    rightEye.position.set(eyeX, eyeY, eyeZ + 0.005)
    head.add(rightEye)

    const rightIris = new THREE.Mesh(this._mediumGeo.iris, materials.iris)
    rightIris.position.set(eyeX, eyeY, eyeZ + 0.008)
    head.add(rightIris)

    const noseY = headCenterY - 0.02
    const noseZ = Math.sqrt(Math.max(0.001, headRadius * headRadius - 0.02 * 0.02))
    const nose = new THREE.Mesh(this._mediumGeo.nose, materials.nose)
    nose.position.set(0, noseY, noseZ + 0.005)
    nose.rotation.x = Math.PI / 2
    head.add(nose)

    const mouthY = headCenterY - 0.06
    const mouthZ = Math.sqrt(Math.max(0.001, headRadius * headRadius - 0.06 * 0.06))
    const mouth = new THREE.Mesh(this._mediumGeo.mouth, materials.mouth)
    mouth.position.set(0, mouthY, mouthZ + 0.003)
    head.add(mouth)

    const leftEar = new THREE.Mesh(this._mediumGeo.ear, materials.skin)
    leftEar.position.set(-0.14, headCenterY - 0.01, 0)
    leftEar.rotation.z = -0.2
    head.add(leftEar)

    const rightEar = new THREE.Mesh(this._mediumGeo.ear, materials.skin)
    rightEar.position.set(0.14, headCenterY - 0.01, 0)
    rightEar.rotation.z = 0.2
    head.add(rightEar)

    const collar = new THREE.Mesh(this._mediumGeo.collar, materials.collar)
    collar.position.y = 0.26
    collar.rotation.x = Math.PI / 2
    collar.castShadow = true
    torso.add(collar)

    const belt = new THREE.Mesh(this._mediumGeo.belt, materials.belt)
    belt.position.y = 0.03
    belt.castShadow = true
    pelvis.add(belt)

    for (let i = 0; i < 3; i++) {
      const button = new THREE.Mesh(this._mediumGeo.button, materials.button)
      button.position.set(0, 0.18 - i * 0.1, 0.115)
      button.rotation.x = Math.PI / 2
      button.castShadow = true
      torso.add(button)
    }

    const leftLeg = new THREE.Group()
    leftLeg.position.set(-0.1, -0.05, 0)
    leftLeg.name = 'leftLeg'
    pelvis.add(leftLeg)

    const leftHip = new THREE.Mesh(this._mediumGeo.hip, materials.pants)
    leftHip.castShadow = true
    leftLeg.add(leftHip)

    const leftLegMesh = new THREE.Mesh(this._mediumGeo.leg, materials.pants)
    leftLegMesh.position.y = -0.25
    leftLegMesh.castShadow = true
    leftLeg.add(leftLegMesh)

    const leftFoot = new THREE.Mesh(this._mediumGeo.foot, materials.shoe)
    leftFoot.position.set(0, -0.55, 0.03)
    leftFoot.name = 'leftFoot'
    leftFoot.castShadow = true
    leftLeg.add(leftFoot)

    const rightLeg = new THREE.Group()
    rightLeg.position.set(0.1, -0.05, 0)
    rightLeg.name = 'rightLeg'
    pelvis.add(rightLeg)

    const rightHip = new THREE.Mesh(this._mediumGeo.hip, materials.pants)
    rightHip.castShadow = true
    rightLeg.add(rightHip)

    const rightLegMesh = new THREE.Mesh(this._mediumGeo.leg, materials.pants)
    rightLegMesh.position.y = -0.25
    rightLegMesh.castShadow = true
    rightLeg.add(rightLegMesh)

    const rightFoot = new THREE.Mesh(this._mediumGeo.foot, materials.shoe)
    rightFoot.position.set(0, -0.55, 0.03)
    rightFoot.name = 'rightFoot'
    rightFoot.castShadow = true
    rightLeg.add(rightFoot)

    const leftArm = new THREE.Group()
    leftArm.position.set(-0.22, 0.22, 0)
    leftArm.name = 'leftArm'
    torso.add(leftArm)

    const leftShoulder = new THREE.Mesh(this._mediumGeo.shoulder, materials.body)
    leftShoulder.castShadow = true
    leftArm.add(leftShoulder)

    const leftArmMesh = new THREE.Mesh(this._mediumGeo.arm, materials.body)
    leftArmMesh.position.y = -0.22
    leftArmMesh.castShadow = true
    leftArm.add(leftArmMesh)

    const leftHand = new THREE.Mesh(this._mediumGeo.hand, materials.skin)
    leftHand.position.set(0, -0.45, 0)
    leftHand.name = 'leftHand'
    leftHand.castShadow = true
    leftArm.add(leftHand)

    const rightArm = new THREE.Group()
    rightArm.position.set(0.22, 0.22, 0)
    rightArm.name = 'rightArm'
    torso.add(rightArm)

    const rightShoulder = new THREE.Mesh(this._mediumGeo.shoulder, materials.body)
    rightShoulder.castShadow = true
    rightArm.add(rightShoulder)

    const rightArmMesh = new THREE.Mesh(this._mediumGeo.arm, materials.body)
    rightArmMesh.position.y = -0.22
    rightArmMesh.castShadow = true
    rightArm.add(rightArmMesh)

    const rightHand = new THREE.Mesh(this._mediumGeo.hand, materials.skin)
    rightHand.position.set(0, -0.45, 0)
    rightHand.name = 'rightHand'
    rightHand.castShadow = true
    rightArm.add(rightHand)

    return group
  }

  _buildLowDetail(materials) {
    const group = new THREE.Group()
    group.name = 'lowDetail'

    const pelvis = new THREE.Group()
    pelvis.position.y = 0.72
    group.add(pelvis)

    const torso = new THREE.Mesh(this._lowGeo.torso, materials.body)
    torso.position.y = 0.275
    torso.name = 'torso'
    torso.castShadow = true
    pelvis.add(torso)

    const neck = new THREE.Mesh(this._lowGeo.neck, materials.skin)
    neck.position.y = 0.275
    neck.name = 'neck'
    neck.castShadow = true
    torso.add(neck)

    const head = new THREE.Mesh(this._lowGeo.head, materials.skin)
    head.position.y = 0.1
    head.name = 'head'
    head.castShadow = true
    neck.add(head)

    const hair = new THREE.Mesh(this._lowGeo.hair, materials.hair)
    hair.position.y = 0.05
    hair.castShadow = true
    head.add(hair)

    const leftLeg = new THREE.Group()
    leftLeg.position.set(-0.1, -0.05, 0)
    leftLeg.name = 'leftLeg'
    pelvis.add(leftLeg)

    const leftLegMesh = new THREE.Mesh(this._lowGeo.leg, materials.pants)
    leftLegMesh.position.y = -0.25
    leftLegMesh.castShadow = true
    leftLeg.add(leftLegMesh)

    const leftFoot = new THREE.Mesh(this._lowGeo.foot, materials.shoe)
    leftFoot.position.set(0, -0.55, 0.03)
    leftFoot.name = 'leftFoot'
    leftFoot.castShadow = true
    leftLeg.add(leftFoot)

    const rightLeg = new THREE.Group()
    rightLeg.position.set(0.1, -0.05, 0)
    rightLeg.name = 'rightLeg'
    pelvis.add(rightLeg)

    const rightLegMesh = new THREE.Mesh(this._lowGeo.leg, materials.pants)
    rightLegMesh.position.y = -0.25
    rightLegMesh.castShadow = true
    rightLeg.add(rightLegMesh)

    const rightFoot = new THREE.Mesh(this._lowGeo.foot, materials.shoe)
    rightFoot.position.set(0, -0.55, 0.03)
    rightFoot.name = 'rightFoot'
    rightFoot.castShadow = true
    rightLeg.add(rightFoot)

    const leftArm = new THREE.Group()
    leftArm.position.set(-0.22, 0.22, 0)
    leftArm.name = 'leftArm'
    torso.add(leftArm)

    const leftArmMesh = new THREE.Mesh(this._lowGeo.arm, materials.body)
    leftArmMesh.position.y = -0.22
    leftArmMesh.castShadow = true
    leftArm.add(leftArmMesh)

    const leftHand = new THREE.Mesh(this._lowGeo.hand, materials.skin)
    leftHand.position.set(0, -0.45, 0)
    leftHand.name = 'leftHand'
    leftHand.castShadow = true
    leftArm.add(leftHand)

    const rightArm = new THREE.Group()
    rightArm.position.set(0.22, 0.22, 0)
    rightArm.name = 'rightArm'
    torso.add(rightArm)

    const rightArmMesh = new THREE.Mesh(this._lowGeo.arm, materials.body)
    rightArmMesh.position.y = -0.22
    rightArmMesh.castShadow = true
    rightArm.add(rightArmMesh)

    const rightHand = new THREE.Mesh(this._lowGeo.hand, materials.skin)
    rightHand.position.set(0, -0.45, 0)
    rightHand.name = 'rightHand'
    rightHand.castShadow = true
    rightArm.add(rightHand)

    return group
  }

  updateAnimation(delta, elapsed) {
    const clampedDelta = Math.min(delta, 0.05)

    this._updateFrustum(elapsed)

    for (const ped of this.pedestrians) {
      if (!this._isVisible(ped)) {
        ped.group.visible = false
        continue
      }
      ped.group.visible = true

      ped.lod.update(this.camera)

      ped.idleTimer += clampedDelta
      if (!ped.isIdle) {
        if (ped.idleTimer > ped.walkDuration) {
          ped.isIdle = true
          ped.idleTimer = 0
          ped.idleDuration = 2 + Math.random() * 3
        }
      } else {
        if (ped.idleTimer > ped.idleDuration) {
          ped.isIdle = false
          ped.idleTimer = 0
          ped.walkDuration = 4 + Math.random() * 6
        }
      }

      if (!ped.isIdle) {
        const speedFactor = ped.waitSpeedFactor !== undefined ? ped.waitSpeedFactor : 1
        ped.progress += clampedDelta * ped.speed * 0.03 * ped.direction * speedFactor

        if (ped.closed) {
          if (ped.progress >= 1) ped.progress -= 1
          if (ped.progress < 0) ped.progress += 1
        } else {
          if (ped.progress >= 1) {
            ped.progress = 1
            ped.direction = -1
          } else if (ped.progress <= 0) {
            ped.progress = 0
            ped.direction = 1
          }
        }
      }

      const t = Math.max(0.002, Math.min(0.998, ped.progress))
      const point = ped.curve.getPointAt(t)
      const tangent = ped.curve.getTangentAt(t)

      ped.group.position.copy(point)
      ped.group.position.y = 0.15

      ped.boundingSphere.center.copy(ped.group.position).y += 0.9

      if (!ped.isIdle) {
        const speedFactor = ped.waitSpeedFactor !== undefined ? ped.waitSpeedFactor : 1
        const animSpeedFactor = Math.max(speedFactor, 0.15)
        const isWaiting = speedFactor < 0.3

        ped.walkPhase += clampedDelta * ped.speed * 8 * animSpeedFactor
        ped.bobPhase += clampedDelta * ped.speed * 8 * animSpeedFactor
        ped.headBobPhase += clampedDelta * ped.speed * 6 * animSpeedFactor
        ped.handPhase += clampedDelta * ped.speed * 10 * animSpeedFactor

        const legSwing = Math.sin(ped.walkPhase) * 0.6 * speedFactor
        const armSwing = Math.sin(ped.walkPhase + Math.PI) * 0.5 * speedFactor
        const kneeBend = Math.max(0, Math.sin(ped.walkPhase)) * 0.4 * speedFactor
        const elbowBend = Math.max(0, Math.sin(ped.walkPhase + Math.PI)) * 0.3 * speedFactor
        const bodyBob = Math.abs(Math.sin(ped.walkPhase)) * 0.04 * speedFactor
        const hipSway = Math.sin(ped.walkPhase * 2) * 0.025 * speedFactor
        const shoulderSway = Math.sin(ped.walkPhase * 2 + Math.PI) * 0.02 * speedFactor
        const headBob = Math.sin(ped.headBobPhase) * 0.02 * speedFactor
        const headTilt = Math.sin(ped.walkPhase * 0.5) * 0.04 * speedFactor
        const torsoLean = Math.sin(ped.walkPhase) * 0.03 * speedFactor

        if (isWaiting) {
          const lookAtCar = Math.sin(elapsed * 2) * 0.1
          if (ped.head) {
            ped.head.rotation.y = lookAtCar
          }
          if (ped.neck) {
            ped.neck.rotation.y = lookAtCar * 0.5
          }
          const waitShift = Math.sin(elapsed * 1.5) * 0.02
          if (ped.torso) {
            ped.torso.position.y = 0.275 + waitShift
          }
        } else {
          const targetAngle = ped.direction === 1
            ? Math.atan2(tangent.x, tangent.z)
            : Math.atan2(tangent.x, tangent.z) + Math.PI
          ped.group.rotation.y = this._lerpAngle(ped.group.rotation.y, targetAngle, Math.min(1, clampedDelta * 8))
        }

        if (ped.leftLeg) {
          ped.leftLeg.rotation.x = legSwing
          ped.leftLeg.position.z = hipSway * 0.5
        }
        if (ped.rightLeg) {
          ped.rightLeg.rotation.x = -legSwing
          ped.rightLeg.position.z = -hipSway * 0.5
        }
        if (ped.leftCalf) {
          const leftKneeBend = Math.max(0, Math.sin(ped.walkPhase + 0.5)) * 0.5 * speedFactor
          ped.leftCalf.rotation.x = -leftKneeBend
        }
        if (ped.rightCalf) {
          const rightKneeBend = Math.max(0, Math.sin(ped.walkPhase - 0.5 + Math.PI)) * 0.5 * speedFactor
          ped.rightCalf.rotation.x = -rightKneeBend
        }
        if (ped.leftArm) {
          ped.leftArm.rotation.x = armSwing
          ped.leftArm.position.z = shoulderSway
        }
        if (ped.rightArm) {
          ped.rightArm.rotation.x = -armSwing
          ped.rightArm.position.z = -shoulderSway
        }
        if (ped.leftForearm) {
          const leftElbowBend = Math.max(0, Math.sin(ped.walkPhase + Math.PI + 0.3)) * 0.6 * speedFactor
          ped.leftForearm.rotation.x = leftElbowBend + 0.15
        }
        if (ped.rightForearm) {
          const rightElbowBend = Math.max(0, Math.sin(ped.walkPhase + 0.3)) * 0.6 * speedFactor
          ped.rightForearm.rotation.x = rightElbowBend + 0.15
        }
        if (ped.leftFoot) {
          const footLift = Math.max(0, Math.sin(ped.walkPhase + Math.PI / 2)) * 0.12 * speedFactor
          ped.leftFoot.position.y = -0.28 + footLift
          ped.leftFoot.rotation.x = legSwing * 0.3
        }
        if (ped.rightFoot) {
          const footLift = Math.max(0, Math.sin(ped.walkPhase - Math.PI / 2)) * 0.12 * speedFactor
          ped.rightFoot.position.y = -0.28 + footLift
          ped.rightFoot.rotation.x = -legSwing * 0.3
        }
        if (ped.torso) {
          ped.torso.position.y = 0.275 + bodyBob
          ped.torso.rotation.z = hipSway * 0.3
          ped.torso.rotation.x = torsoLean
        }
        if (ped.head) {
          ped.head.position.y = 0.15 + headBob
          ped.head.rotation.z = headTilt
          ped.head.rotation.x = -torsoLean * 0.5
        }
        if (ped.neck) {
          ped.neck.rotation.z = headTilt * 0.5
        }

        this._updateFingerAnimation(ped, clampedDelta)
        this._updateNeckMuscleAnimation(ped)
      } else {
        const idleBreath = Math.sin(elapsed * 1.2 + ped.bobPhase) * 0.008
        const idleHeadTurn = Math.sin(elapsed * 0.8 + ped.bobPhase) * 0.05

        if (ped.torso) {
          ped.torso.position.y = 0.275 + idleBreath
        }
        if (ped.head) {
          ped.head.rotation.y = idleHeadTurn
        }
        if (ped.neck) {
          ped.neck.rotation.y = idleHeadTurn * 0.7
        }
      }
    }
  }

  _updateFingerAnimation(ped, delta) {
    const animAmount = ped.isIdle ? 0.1 : 0.3
    const speed = ped.isIdle ? 0.5 : 2

    for (let hand = 0; hand < 2; hand++) {
      const fingers = hand === 0 ? ped.leftHandFingers : ped.rightHandFingers
      const handPhaseOffset = hand === 0 ? 0 : Math.PI

      for (let f = 0; f < fingers.length; f++) {
        const finger = fingers[f]
        const fingerPhaseOffset = f * 0.3 + handPhaseOffset

        for (let j = 0; j < finger.length; j++) {
          const bone = finger[j]
          if (!bone) continue

          const curlBase = [0.2, 0.35, 0.4][j]
          const curlAmount = curlBase * animAmount
          const curl = Math.sin(ped.handPhase * speed + fingerPhaseOffset + j * 0.2) * curlAmount
          bone.rotation.x = curl

          if (j > 0) {
            const splay = Math.sin(ped.handPhase * speed * 0.5 + fingerPhaseOffset) * 0.05 * animAmount
            bone.rotation.y = splay * (f < 2 ? -1 : 1)
          }
        }
      }
    }
  }

  _updateNeckMuscleAnimation(ped) {
    if (!ped.neckMuscles) return

    const [leftSCM, rightSCM, trapezius] = ped.neckMuscles
    if (!leftSCM || !rightSCM || !trapezius) return

    const headTilt = ped.head ? ped.head.rotation.z : 0
    const breathScale = ped.isIdle ? 1 : 0.5
    const breath = Math.sin(ped.bobPhase * 0.5) * 0.02 * breathScale

    leftSCM.scale.y = 1 + headTilt * 0.3 + breath
    rightSCM.scale.y = 1 - headTilt * 0.3 + breath
    trapezius.scale.y = 1 + breath * 0.5
  }

  _updateFrustum(elapsed) {
    const now = elapsed * 1000
    if (now - this._lastFrustumCheck < FRUSTUM_CHECK_INTERVAL) return
    this._lastFrustumCheck = now

    this._projScreenMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    )
    this._frustum.setFromProjectionMatrix(this._projScreenMatrix)
  }

  _isVisible(ped) {
    return this._frustum.intersectsSphere(ped.boundingSphere)
  }

  _lerpAngle(current, target, factor) {
    let diff = target - current
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    return current + diff * factor
  }

  getPerformanceStats() {
    let totalTriangles = 0
    let visibleCount = 0

    for (const ped of this.pedestrians) {
      if (ped.visible) visibleCount++

      const currentLOD = ped.lod.getCurrentLevel()
      if (currentLOD === 0) {
        totalTriangles += this._countTriangles(this._highGeo)
      } else if (currentLOD === 1) {
        totalTriangles += this._countTriangles(this._mediumGeo)
      } else {
        totalTriangles += this._countTriangles(this._lowGeo)
      }
    }

    return {
      total: this.pedestrians.length,
      visible: visibleCount,
      triangles: totalTriangles,
    }
  }

  _countTriangles(geoSet) {
    let count = 0
    for (const geo of Object.values(geoSet)) {
      if (geo.index) {
        count += geo.index.count / 3
      } else if (geo.attributes.position) {
        count += geo.attributes.position.count / 3
      }
    }
    return Math.round(count)
  }

  dispose() {
    this._disposeGeometry(this._highGeo)
    this._disposeGeometry(this._mediumGeo)
    this._disposeGeometry(this._lowGeo)

    this._disposeMaterials(this._sharedMaterials)

    this.pedestrianGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
        else child.material.dispose()
      }
    })
    this.parentGroup.remove(this.pedestrianGroup)
    this.pedestrians = []
  }

  _disposeGeometry(geoSet) {
    for (const geo of Object.values(geoSet)) {
      if (geo && geo.dispose) geo.dispose()
    }
  }

  _disposeMaterials(matSet) {
    for (const mat of Object.values(matSet)) {
      if (mat && mat.dispose) mat.dispose()
    }
  }
}
