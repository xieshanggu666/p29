import * as THREE from 'three'

const LOD_DISTANCES = { high: 30, medium: 60, low: 100 }
const FRUSTUM_CHECK_INTERVAL = 500

const _sharedMats = {
  body: new THREE.MeshStandardMaterial({ roughness: 0.65, metalness: 0.05 }),
  skin: new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.0 }),
  hair: new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.0 }),
  pants: new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.0 }),
  shoe: new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.1 }),
  eye: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.1, metalness: 0.3 }),
}

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

    const bodyMat = _sharedMats.body.clone()
    bodyMat.color.setHex(color)
    const skinMat = _sharedMats.skin.clone()
    skinMat.color.setHex(skinColor)
    const hairMat = _sharedMats.hair.clone()
    hairMat.color.setHex(hairColor)
    const pantsMat = _sharedMats.pants.clone()
    pantsMat.color.setHex(pantColor)
    const shoeMat = _sharedMats.shoe.clone()
    shoeMat.color.setHex(shoeColor)

    const materials = { body: bodyMat, skin: skinMat, hair: hairMat, pants: pantsMat, shoe: shoeMat }

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
      leftLeg: highDetail.getObjectByName('leftLeg'),
      rightLeg: highDetail.getObjectByName('rightLeg'),
      leftCalf: highDetail.getObjectByName('leftCalf'),
      rightCalf: highDetail.getObjectByName('rightCalf'),
      leftArm: highDetail.getObjectByName('leftArm'),
      rightArm: highDetail.getObjectByName('rightArm'),
      leftForearm: highDetail.getObjectByName('leftForearm'),
      rightForearm: highDetail.getObjectByName('rightForearm'),
    }
  }

  _createHighDetailGeometry() {
    const headGeo = new THREE.SphereGeometry(0.15, 16, 12)
    const torsoGeo = new THREE.CapsuleGeometry(0.14, 0.3, 6, 10)
    const neckGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.08, 8)
    const shoulderGeo = new THREE.SphereGeometry(0.055, 8, 6)
    const upperArmGeo = new THREE.CapsuleGeometry(0.04, 0.16, 3, 8)
    const forearmGeo = new THREE.CapsuleGeometry(0.032, 0.16, 3, 8)
    const elbowGeo = new THREE.SphereGeometry(0.038, 6, 4)
    const handGeo = new THREE.CapsuleGeometry(0.028, 0.04, 3, 6)
    handGeo.scale(1.4, 1, 1.8)
    handGeo.computeVertexNormals()
    const hipGeo = new THREE.SphereGeometry(0.065, 8, 6)
    const thighGeo = new THREE.CapsuleGeometry(0.055, 0.18, 4, 8)
    const kneeGeo = new THREE.SphereGeometry(0.045, 6, 4)
    const calfGeo = new THREE.CapsuleGeometry(0.04, 0.18, 3, 8)
    const footGeo = new THREE.CapsuleGeometry(0.035, 0.06, 3, 6)
    footGeo.scale(1.4, 0.8, 2.2)
    footGeo.computeVertexNormals()
    const eyeGeo = new THREE.SphereGeometry(0.02, 6, 4)
    const hairGeo = new THREE.SphereGeometry(0.155, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
    const noseGeo = new THREE.CapsuleGeometry(0.012, 0.02, 3, 4)
    noseGeo.scale(0.8, 1, 1.2)
    noseGeo.computeVertexNormals()

    return {
      head: headGeo, torso: torsoGeo, neck: neckGeo,
      shoulder: shoulderGeo, upperArm: upperArmGeo, forearm: forearmGeo,
      elbow: elbowGeo, hand: handGeo, hip: hipGeo,
      thigh: thighGeo, knee: kneeGeo, calf: calfGeo,
      foot: footGeo, eye: eyeGeo, hair: hairGeo, nose: noseGeo,
    }
  }

  _createMediumDetailGeometry() {
    return {
      head: new THREE.SphereGeometry(0.15, 12, 8),
      torso: new THREE.CapsuleGeometry(0.14, 0.3, 4, 8),
      neck: new THREE.CylinderGeometry(0.055, 0.065, 0.06, 6),
      arm: new THREE.CapsuleGeometry(0.035, 0.4, 3, 6),
      hand: new THREE.CapsuleGeometry(0.025, 0.03, 3, 4),
      leg: new THREE.CapsuleGeometry(0.045, 0.5, 3, 6),
      foot: new THREE.CapsuleGeometry(0.03, 0.05, 3, 4),
      hair: new THREE.SphereGeometry(0.155, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    }
  }

  _createLowDetailGeometry() {
    return {
      head: new THREE.SphereGeometry(0.15, 8, 6),
      torso: new THREE.CapsuleGeometry(0.14, 0.3, 3, 6),
      neck: new THREE.CylinderGeometry(0.055, 0.065, 0.06, 4),
      arm: new THREE.CapsuleGeometry(0.035, 0.4, 2, 4),
      hand: new THREE.SphereGeometry(0.03, 4, 3),
      leg: new THREE.CapsuleGeometry(0.045, 0.5, 2, 4),
      foot: new THREE.CapsuleGeometry(0.03, 0.05, 2, 3),
      hair: new THREE.SphereGeometry(0.155, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2),
    }
  }

  _buildHighDetail(materials) {
    const group = new THREE.Group()
    group.name = 'highDetail'

    const pelvis = new THREE.Group()
    pelvis.position.y = 0.8
    pelvis.name = 'pelvis'
    group.add(pelvis)

    const torso = new THREE.Mesh(this._highGeo.torso, materials.body)
    torso.position.y = 0.28
    torso.name = 'torso'
    pelvis.add(torso)

    const neck = new THREE.Mesh(this._highGeo.neck, materials.skin)
    neck.position.y = 0.32
    neck.name = 'neck'
    torso.add(neck)

    const headGroup = new THREE.Group()
    headGroup.position.y = 0.05
    headGroup.name = 'headGroup'
    neck.add(headGroup)

    const head = new THREE.Mesh(this._highGeo.head, materials.skin)
    head.position.y = 0.15
    head.name = 'head'
    headGroup.add(head)

    const leftEye = new THREE.Mesh(this._highGeo.eye, _sharedMats.eye)
    leftEye.position.set(-0.045, 0.175, 0.13)
    headGroup.add(leftEye)

    const rightEye = new THREE.Mesh(this._highGeo.eye, _sharedMats.eye)
    rightEye.position.set(0.045, 0.175, 0.13)
    headGroup.add(rightEye)

    const nose = new THREE.Mesh(this._highGeo.nose, materials.skin)
    nose.position.set(0, 0.13, 0.14)
    nose.rotation.x = Math.PI / 2
    headGroup.add(nose)

    const hair = new THREE.Mesh(this._highGeo.hair, materials.hair)
    hair.position.y = 0.15
    headGroup.add(hair)

    this._buildLegs(pelvis, materials)
    this._buildArms(torso, materials)

    return group
  }

  _buildLegs(pelvis, materials) {
    const leftLeg = new THREE.Group()
    leftLeg.position.set(-0.1, -0.05, 0)
    leftLeg.name = 'leftLeg'
    pelvis.add(leftLeg)

    const leftHip = new THREE.Mesh(this._highGeo.hip, materials.pants)
    leftLeg.add(leftHip)
    const leftThigh = new THREE.Mesh(this._highGeo.thigh, materials.pants)
    leftThigh.position.y = -0.14
    leftLeg.add(leftThigh)

    const leftCalf = new THREE.Group()
    leftCalf.position.y = -0.28
    leftCalf.name = 'leftCalf'
    leftLeg.add(leftCalf)
    const leftKnee = new THREE.Mesh(this._highGeo.knee, materials.pants)
    leftCalf.add(leftKnee)
    const leftCalfMesh = new THREE.Mesh(this._highGeo.calf, materials.pants)
    leftCalfMesh.position.y = -0.14
    leftCalf.add(leftCalfMesh)
    const leftFoot = new THREE.Mesh(this._highGeo.foot, materials.shoe)
    leftFoot.position.set(0, -0.28, 0.03)
    leftFoot.name = 'leftFoot'
    leftCalf.add(leftFoot)

    const rightLeg = new THREE.Group()
    rightLeg.position.set(0.1, -0.05, 0)
    rightLeg.name = 'rightLeg'
    pelvis.add(rightLeg)

    const rightHip = new THREE.Mesh(this._highGeo.hip, materials.pants)
    rightLeg.add(rightHip)
    const rightThigh = new THREE.Mesh(this._highGeo.thigh, materials.pants)
    rightThigh.position.y = -0.14
    rightLeg.add(rightThigh)

    const rightCalf = new THREE.Group()
    rightCalf.position.y = -0.28
    rightCalf.name = 'rightCalf'
    rightLeg.add(rightCalf)
    const rightKnee = new THREE.Mesh(this._highGeo.knee, materials.pants)
    rightCalf.add(rightKnee)
    const rightCalfMesh = new THREE.Mesh(this._highGeo.calf, materials.pants)
    rightCalfMesh.position.y = -0.14
    rightCalf.add(rightCalfMesh)
    const rightFoot = new THREE.Mesh(this._highGeo.foot, materials.shoe)
    rightFoot.position.set(0, -0.28, 0.03)
    rightFoot.name = 'rightFoot'
    rightCalf.add(rightFoot)
  }

  _buildArms(torso, materials) {
    const leftArm = new THREE.Group()
    leftArm.position.set(-0.22, 0.22, 0)
    leftArm.name = 'leftArm'
    torso.add(leftArm)
    const leftShoulder = new THREE.Mesh(this._highGeo.shoulder, materials.body)
    leftArm.add(leftShoulder)
    const leftUpperArm = new THREE.Mesh(this._highGeo.upperArm, materials.body)
    leftUpperArm.position.y = -0.12
    leftArm.add(leftUpperArm)
    const leftForearm = new THREE.Group()
    leftForearm.position.y = -0.24
    leftForearm.name = 'leftForearm'
    leftArm.add(leftForearm)
    const leftElbow = new THREE.Mesh(this._highGeo.elbow, materials.body)
    leftForearm.add(leftElbow)
    const leftForearmMesh = new THREE.Mesh(this._highGeo.forearm, materials.body)
    leftForearmMesh.position.y = -0.12
    leftForearm.add(leftForearmMesh)
    const leftHand = new THREE.Mesh(this._highGeo.hand, materials.skin)
    leftHand.position.set(0, -0.24, 0)
    leftHand.name = 'leftHand'
    leftForearm.add(leftHand)

    const rightArm = new THREE.Group()
    rightArm.position.set(0.22, 0.22, 0)
    rightArm.name = 'rightArm'
    torso.add(rightArm)
    const rightShoulder = new THREE.Mesh(this._highGeo.shoulder, materials.body)
    rightArm.add(rightShoulder)
    const rightUpperArm = new THREE.Mesh(this._highGeo.upperArm, materials.body)
    rightUpperArm.position.y = -0.12
    rightArm.add(rightUpperArm)
    const rightForearm = new THREE.Group()
    rightForearm.position.y = -0.24
    rightForearm.name = 'rightForearm'
    rightArm.add(rightForearm)
    const rightElbow = new THREE.Mesh(this._highGeo.elbow, materials.body)
    rightForearm.add(rightElbow)
    const rightForearmMesh = new THREE.Mesh(this._highGeo.forearm, materials.body)
    rightForearmMesh.position.y = -0.12
    rightForearm.add(rightForearmMesh)
    const rightHand = new THREE.Mesh(this._highGeo.hand, materials.skin)
    rightHand.position.set(0, -0.24, 0)
    rightHand.name = 'rightHand'
    rightForearm.add(rightHand)
  }

  _buildMediumDetail(materials) {
    const group = new THREE.Group()
    group.name = 'mediumDetail'

    const pelvis = new THREE.Group()
    pelvis.position.y = 0.8
    group.add(pelvis)

    const torso = new THREE.Mesh(this._mediumGeo.torso, materials.body)
    torso.position.y = 0.28
    torso.name = 'torso'
    pelvis.add(torso)

    const neck = new THREE.Mesh(this._mediumGeo.neck, materials.skin)
    neck.position.y = 0.32
    torso.add(neck)

    const head = new THREE.Mesh(this._mediumGeo.head, materials.skin)
    head.position.y = 0.12
    head.name = 'head'
    neck.add(head)

    const hair = new THREE.Mesh(this._mediumGeo.hair, materials.hair)
    hair.position.y = 0.02
    head.add(hair)

    const leftLeg = new THREE.Group()
    leftLeg.position.set(-0.1, -0.05, 0)
    leftLeg.name = 'leftLeg'
    pelvis.add(leftLeg)
    const leftLegMesh = new THREE.Mesh(this._mediumGeo.leg, materials.pants)
    leftLegMesh.position.y = -0.25
    leftLeg.add(leftLegMesh)
    const leftFoot = new THREE.Mesh(this._mediumGeo.foot, materials.shoe)
    leftFoot.position.set(0, -0.55, 0.03)
    leftFoot.name = 'leftFoot'
    leftLeg.add(leftFoot)

    const rightLeg = new THREE.Group()
    rightLeg.position.set(0.1, -0.05, 0)
    rightLeg.name = 'rightLeg'
    pelvis.add(rightLeg)
    const rightLegMesh = new THREE.Mesh(this._mediumGeo.leg, materials.pants)
    rightLegMesh.position.y = -0.25
    rightLeg.add(rightLegMesh)
    const rightFoot = new THREE.Mesh(this._mediumGeo.foot, materials.shoe)
    rightFoot.position.set(0, -0.55, 0.03)
    rightFoot.name = 'rightFoot'
    rightLeg.add(rightFoot)

    const leftArm = new THREE.Group()
    leftArm.position.set(-0.22, 0.22, 0)
    leftArm.name = 'leftArm'
    torso.add(leftArm)
    const leftArmMesh = new THREE.Mesh(this._mediumGeo.arm, materials.body)
    leftArmMesh.position.y = -0.22
    leftArm.add(leftArmMesh)
    const leftHand = new THREE.Mesh(this._mediumGeo.hand, materials.skin)
    leftHand.position.set(0, -0.45, 0)
    leftHand.name = 'leftHand'
    leftArm.add(leftHand)

    const rightArm = new THREE.Group()
    rightArm.position.set(0.22, 0.22, 0)
    rightArm.name = 'rightArm'
    torso.add(rightArm)
    const rightArmMesh = new THREE.Mesh(this._mediumGeo.arm, materials.body)
    rightArmMesh.position.y = -0.22
    rightArm.add(rightArmMesh)
    const rightHand = new THREE.Mesh(this._mediumGeo.hand, materials.skin)
    rightHand.position.set(0, -0.45, 0)
    rightHand.name = 'rightHand'
    rightArm.add(rightHand)

    return group
  }

  _buildLowDetail(materials) {
    const group = new THREE.Group()
    group.name = 'lowDetail'

    const pelvis = new THREE.Group()
    pelvis.position.y = 0.8
    group.add(pelvis)

    const torso = new THREE.Mesh(this._lowGeo.torso, materials.body)
    torso.position.y = 0.28
    torso.name = 'torso'
    pelvis.add(torso)

    const neck = new THREE.Mesh(this._lowGeo.neck, materials.skin)
    neck.position.y = 0.32
    torso.add(neck)

    const head = new THREE.Mesh(this._lowGeo.head, materials.skin)
    head.position.y = 0.12
    head.name = 'head'
    neck.add(head)

    const hair = new THREE.Mesh(this._lowGeo.hair, materials.hair)
    hair.position.y = 0.02
    head.add(hair)

    const leftLeg = new THREE.Group()
    leftLeg.position.set(-0.1, -0.05, 0)
    leftLeg.name = 'leftLeg'
    pelvis.add(leftLeg)
    const leftLegMesh = new THREE.Mesh(this._lowGeo.leg, materials.pants)
    leftLegMesh.position.y = -0.25
    leftLeg.add(leftLegMesh)
    const leftFoot = new THREE.Mesh(this._lowGeo.foot, materials.shoe)
    leftFoot.position.set(0, -0.55, 0.03)
    leftFoot.name = 'leftFoot'
    leftLeg.add(leftFoot)

    const rightLeg = new THREE.Group()
    rightLeg.position.set(0.1, -0.05, 0)
    rightLeg.name = 'rightLeg'
    pelvis.add(rightLeg)
    const rightLegMesh = new THREE.Mesh(this._lowGeo.leg, materials.pants)
    rightLegMesh.position.y = -0.25
    rightLeg.add(rightLegMesh)
    const rightFoot = new THREE.Mesh(this._lowGeo.foot, materials.shoe)
    rightFoot.position.set(0, -0.55, 0.03)
    rightFoot.name = 'rightFoot'
    rightLeg.add(rightFoot)

    const leftArm = new THREE.Group()
    leftArm.position.set(-0.22, 0.22, 0)
    leftArm.name = 'leftArm'
    torso.add(leftArm)
    const leftArmMesh = new THREE.Mesh(this._lowGeo.arm, materials.body)
    leftArmMesh.position.y = -0.22
    leftArm.add(leftArmMesh)
    const leftHand = new THREE.Mesh(this._lowGeo.hand, materials.skin)
    leftHand.position.set(0, -0.45, 0)
    leftHand.name = 'leftHand'
    leftArm.add(leftHand)

    const rightArm = new THREE.Group()
    rightArm.position.set(0.22, 0.22, 0)
    rightArm.name = 'rightArm'
    torso.add(rightArm)
    const rightArmMesh = new THREE.Mesh(this._lowGeo.arm, materials.body)
    rightArmMesh.position.y = -0.22
    rightArm.add(rightArmMesh)
    const rightHand = new THREE.Mesh(this._lowGeo.hand, materials.skin)
    rightHand.position.set(0, -0.45, 0)
    rightHand.name = 'rightHand'
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
      ped.group.position.y = 0

      if (!ped.isIdle) {
        const speedFactor = ped.waitSpeedFactor !== undefined ? ped.waitSpeedFactor : 1
        const animSpeedFactor = Math.max(speedFactor, 0.15)

        ped.walkPhase += clampedDelta * ped.speed * 8 * animSpeedFactor

        const legSwing = Math.sin(ped.walkPhase) * 0.6 * speedFactor
        const armSwing = Math.sin(ped.walkPhase + Math.PI) * 0.5 * speedFactor
        const bodyBob = Math.abs(Math.sin(ped.walkPhase)) * 0.04 * speedFactor

        const targetAngle = ped.direction === 1
          ? Math.atan2(tangent.x, tangent.z)
          : Math.atan2(tangent.x, tangent.z) + Math.PI
        ped.group.rotation.y = this._lerpAngle(ped.group.rotation.y, targetAngle, Math.min(1, clampedDelta * 8))

        if (ped.leftLeg) ped.leftLeg.rotation.x = legSwing
        if (ped.rightLeg) ped.rightLeg.rotation.x = -legSwing
        if (ped.leftCalf) {
          ped.leftCalf.rotation.x = -Math.max(0, Math.sin(ped.walkPhase + 0.5)) * 0.5 * speedFactor
        }
        if (ped.rightCalf) {
          ped.rightCalf.rotation.x = -Math.max(0, Math.sin(ped.walkPhase - 0.5 + Math.PI)) * 0.5 * speedFactor
        }
        if (ped.leftArm) ped.leftArm.rotation.x = armSwing
        if (ped.rightArm) ped.rightArm.rotation.x = -armSwing
        if (ped.leftForearm) {
          ped.leftForearm.rotation.x = Math.max(0, Math.sin(ped.walkPhase + Math.PI + 0.3)) * 0.6 * speedFactor + 0.15
        }
        if (ped.rightForearm) {
          ped.rightForearm.rotation.x = Math.max(0, Math.sin(ped.walkPhase + 0.3)) * 0.6 * speedFactor + 0.15
        }
        if (ped.torso) {
          ped.torso.position.y = 0.28 + bodyBob
        }
      } else {
        if (ped.torso) ped.torso.position.y = 0.28 + Math.sin(elapsed * 1.2 + ped.bobPhase) * 0.008
      }
    }
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
    ped.boundingSphere.center.copy(ped.group.position)
    return this._frustum.intersectsSphere(ped.boundingSphere)
  }

  _lerpAngle(current, target, factor) {
    let diff = target - current
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    return current + diff * factor
  }

  getPerformanceStats() {
    let visibleCount = 0
    for (const ped of this.pedestrians) {
      if (ped.visible) visibleCount++
    }
    return {
      total: this.pedestrians.length,
      visible: visibleCount,
    }
  }

  dispose() {
    this._disposeGeometry(this._highGeo)
    this._disposeGeometry(this._mediumGeo)
    this._disposeGeometry(this._lowGeo)

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
}
