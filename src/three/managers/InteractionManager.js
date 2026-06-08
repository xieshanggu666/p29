import * as THREE from 'three'

export class InteractionManager {
  constructor(sceneManager, onSelect) {
    this.sceneManager = sceneManager
    this.onSelect = onSelect
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.selectedObject = null
    this.hoveredObject = null
    this._onClick = this._onClick.bind(this)
    this._onMouseMove = this._onMouseMove.bind(this)
    this._bindEvents()
  }

  _bindEvents() {
    const canvas = this.sceneManager.renderer.domElement
    canvas.addEventListener('click', this._onClick)
    canvas.addEventListener('mousemove', this._onMouseMove)
  }

  _getMouseNDC(event) {
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  _findIntersected() {
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera)
    const intersects = this.raycaster.intersectObjects(
      this.sceneManager.scene.children, true
    )
    for (let i = 0; i < intersects.length; i++) {
      let obj = intersects[i].object
      while (obj) {
        if (obj.userData && obj.userData.interactive) {
          return { object: obj, point: intersects[i].point }
        }
        obj = obj.parent
      }
    }
    return null
  }

  _onClick(event) {
    this._getMouseNDC(event)
    const result = this._findIntersected()
    if (result) {
      if (this.selectedObject && this.selectedObject !== result.object) {
        this._unhighlight(this.selectedObject)
      }
      this.selectedObject = result.object
      this._highlight(result.object)
      if (this.onSelect) {
        this.onSelect(result.object, result.point)
      }
    } else {
      if (this.selectedObject) {
        this._unhighlight(this.selectedObject)
        this.selectedObject = null
      }
      if (this.onSelect) {
        this.onSelect(null, null)
      }
    }
  }

  _onMouseMove(event) {
    this._getMouseNDC(event)
    const result = this._findIntersected()
    if (result) {
      if (this.hoveredObject && this.hoveredObject !== result.object) {
        this._unhighlightHover(this.hoveredObject)
      }
      this.hoveredObject = result.object
      this._highlightHover(result.object)
      this.sceneManager.renderer.domElement.style.cursor = 'pointer'
    } else {
      if (this.hoveredObject) {
        this._unhighlightHover(this.hoveredObject)
        this.hoveredObject = null
      }
      this.sceneManager.renderer.domElement.style.cursor = 'default'
    }
  }

  _highlight(obj) {
    if (obj.material && obj.material.emissive) {
      obj.userData._origEmissive = obj.material.emissive.getHex()
      obj.material.emissive.setHex(0x444444)
    }
  }

  _unhighlight(obj) {
    if (obj.material && obj.material.emissive) {
      const orig = obj.userData._origEmissive !== undefined ? obj.userData._origEmissive : 0x000000
      obj.material.emissive.setHex(orig)
    }
  }

  _highlightHover(obj) {
    if (obj.material && obj.material.emissive && obj !== this.selectedObject) {
      obj.userData._origEmissiveHover = obj.material.emissive.getHex()
      obj.material.emissive.setHex(0x222222)
    }
  }

  _unhighlightHover(obj) {
    if (obj.material && obj.material.emissive && obj !== this.selectedObject) {
      const orig = obj.userData._origEmissiveHover !== undefined ? obj.userData._origEmissiveHover : 0x000000
      obj.material.emissive.setHex(orig)
    }
  }

  dispose() {
    const canvas = this.sceneManager.renderer.domElement
    canvas.removeEventListener('click', this._onClick)
    canvas.removeEventListener('mousemove', this._onMouseMove)
  }
}
