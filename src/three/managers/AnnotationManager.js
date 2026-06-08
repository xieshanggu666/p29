import * as THREE from 'three'

export class AnnotationManager {
  constructor(sceneManager) {
    this.sceneManager = sceneManager
    this.annotations = new Map()
    this.spriteGroup = new THREE.Group()
    this.spriteGroup.name = 'annotations'
    this.sceneManager.scene.add(this.spriteGroup)
  }

  add(id, position, data, color = 0xff4444) {
    if (this.annotations.has(id)) {
      this.remove(id)
    }

    const sprite = this._createMarkerSprite(color)
    sprite.position.set(position.x, position.y + 1, position.z)
    sprite.userData = {
      annotationId: id,
      interactive: true,
      annotationData: data
    }

    const pole = this._createPole(position, color)
    const group = new THREE.Group()
    group.add(sprite)
    group.add(pole)
    group.userData = { annotationId: id, interactive: true, annotationData: data }

    this.spriteGroup.add(group)
    this.annotations.set(id, { group, data, position })
    return group
  }

  remove(id) {
    const annotation = this.annotations.get(id)
    if (!annotation) return
    this.spriteGroup.remove(annotation.group)
    annotation.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (child.material.map) child.material.map.dispose()
        child.material.dispose()
      }
    })
    this.annotations.delete(id)
  }

  show(id) {
    const annotation = this.annotations.get(id)
    if (annotation) annotation.group.visible = true
  }

  hide(id) {
    const annotation = this.annotations.get(id)
    if (annotation) annotation.group.visible = true
  }

  showAll() {
    this.spriteGroup.visible = true
  }

  hideAll() {
    this.spriteGroup.visible = false
  }

  getAll() {
    const result = []
    this.annotations.forEach((value, key) => {
      result.push({ id: key, ...value.data, position: value.position })
    })
    return result
  }

  _createMarkerSprite(color) {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')

    ctx.beginPath()
    ctx.arc(32, 28, 20, 0, Math.PI * 2)
    ctx.fillStyle = '#' + new THREE.Color(color).getHexString()
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(32, 48)
    ctx.lineTo(24, 32)
    ctx.lineTo(40, 32)
    ctx.closePath()
    ctx.fillStyle = '#' + new THREE.Color(color).getHexString()
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('i', 32, 28)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      sizeAttenuation: true
    })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(3, 3, 1)
    return sprite
  }

  _createPole(position, color) {
    const geo = new THREE.BufferGeometry()
    const vertices = new Float32Array([
      position.x, 0, position.z,
      position.x, position.y + 1, position.z
    ])
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 })
    return new THREE.Line(geo, mat)
  }

  updateAnimation(elapsed) {
    this.spriteGroup.children.forEach((group) => {
      const sprite = group.children[0]
      if (sprite && sprite.isSprite) {
        sprite.position.y = 1 + Math.sin(elapsed * 2 + group.userData.annotationId.charCodeAt(0)) * 0.15
      }
    })
  }

  dispose() {
    this.annotations.forEach((_, key) => this.remove(key))
    this.sceneManager.scene.remove(this.spriteGroup)
  }
}
