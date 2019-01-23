'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Three = require('./Three');

var _Three2 = _interopRequireDefault(_Three);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var OrbitControls = require('three-orbit-controls')(_Three2.default);

var DIRECTIONAL_LIGHT = 'directionalLight';

var Paint = function () {
  function Paint() {
    _classCallCheck(this, Paint);
  }

  _createClass(Paint, [{
    key: 'init',
    value: function init(context) {
      this.clean();

      this.loader = new _Three2.default.STLLoader();
      this.scene = new _Three2.default.Scene();
      this.renderer = new _Three2.default.WebGLRenderer({
        antialias: true
      });

      this.meshes = [];
      this.bedMesh = null;
      this.initialBox = new _Three2.default.Box3();
      this.reqNumber = 0;

      this.component = context;
      this.urls = context.props.urls;
      this.width = context.props.width;
      this.height = context.props.height;
      this.modelColor = context.props.modelColors;
      this.backgroundColor = context.props.backgroundColor;
      this.orbitControls = context.props.orbitControls;
      this.rotate = context.props.rotate;
      this.cameraX = context.props.cameraX;
      this.cameraY = context.props.cameraY;
      this.cameraZ = context.props.cameraZ;
      this.rotationSpeeds = context.props.rotationSpeeds;
      this.lightX = context.props.lightX;
      this.lightY = context.props.lightY;
      this.lightZ = context.props.lightZ;
      this.lightColor = context.props.lightColor;

      //Detector.addGetWebGLMessage();
      this.distance = 10000;

      var directionalLight = new _Three2.default.DirectionalLight(this.lightColor);
      directionalLight.position.x = this.lightX;
      directionalLight.position.y = this.lightY;
      directionalLight.position.z = this.lightZ;
      directionalLight.position.normalize();
      directionalLight.name = DIRECTIONAL_LIGHT;

      var directionalLight2 = new _Three2.default.DirectionalLight(this.lightColor);
      directionalLight2.position.x = -this.lightX;
      directionalLight2.position.y = -this.lightY;
      directionalLight2.position.z = this.lightZ;
      directionalLight2.position.normalize();
      directionalLight2.name = DIRECTIONAL_LIGHT + '2';

      this.scene.add(directionalLight);
      this.scene.add(directionalLight2);

      this.reqNumber += 1;
      this.addSTLToScene(this.reqNumber);
    }
  }, {
    key: 'addSTLToScene',
    value: function addSTLToScene(reqId) {
      var _this = this;

      this.loader.crossOrigin = '';
      var promises = [];
      this.urls.forEach(function (url, index) {
        promises.push(_this.addSTLPromise(url, reqId, index));
      });

      Promise.all(promises).then(function (resolvedArray) {
        resolvedArray.forEach(function (mesh) {
          // Set the object's dimensions
          mesh.geometry.computeBoundingBox();

          if (_this.rotate) {
            mesh.rotation.x = _this.rotationSpeeds[0];
            mesh.rotation.y = _this.rotationSpeeds[1];
            mesh.rotation.z = _this.rotationSpeeds[2];
          }

          _this.meshes.push(mesh);
          _this.initialBox = _this.initialBox && _this.initialBox.union(mesh.geometry.boundingBox) || mesh.geometry.boundingBox;
        });

        var centerVector = new _Three2.default.Vector3();
        _this.initialBox.center(centerVector);

        _this.meshes.forEach(function (mesh) {
          mesh.geometry.translate(-centerVector.x, -centerVector.y, -centerVector.z);
          _this.scene.add(mesh);
        });

        _this.bedMesh = new _Three2.default.Mesh(new _Three2.default.CubeGeometry(250, 250, 1), new _Three2.default.MeshBasicMaterial({
          color: '#999999',
          transparent: true,
          opacity: 0.5
        }));

        _this.xDims = _this.initialBox.max.x - _this.initialBox.min.x;
        _this.yDims = _this.initialBox.max.y - _this.initialBox.min.y;
        _this.zDims = _this.initialBox.max.z - _this.initialBox.min.z;

        _this.bedMesh.geometry.center();
        _this.bedMesh.geometry.translate(0, 0, -_this.zDims / 2 - 0.5);

        _this.scene.add(_this.bedMesh);

        _this.axisHelper = new _Three2.default.AxisHelper(_this.bedMesh.geometry.boundingBox.max.x - _this.bedMesh.geometry.boundingBox.min.x);

        _this.axisHelper.position.set(_this.bedMesh.geometry.boundingBox.min.x, _this.bedMesh.geometry.boundingBox.min.y, _this.bedMesh.geometry.boundingBox.max.z);

        _this.scene.add(_this.axisHelper);

        _this.addCamera();
        _this.addInteractionControls();
        _this.addToReactComponent();

        // Start the animation
        _this.animate();
      });
    }
  }, {
    key: 'addSTLPromise',
    value: function addSTLPromise(url, reqId, index) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.loader.load(url, function (geometry) {
          if (_this2.reqNumber !== reqId) {
            return;
          }
          // Calculate mesh noramls for MeshLambertMaterial.
          geometry.computeFaceNormals();
          geometry.computeVertexNormals();

          // Center the object
          // geometry.center();

          var mesh = new _Three2.default.Mesh(geometry, new _Three2.default.MeshLambertMaterial({
            overdraw: true,
            color: _this2.modelColor[index % _this2.modelColor.length]
          }));

          resolve(mesh);
        });
      });
    }
  }, {
    key: 'addCamera',
    value: function addCamera() {
      // Add the camera
      this.camera = new _Three2.default.PerspectiveCamera(30, this.width / this.height, 1, this.distance);

      if (this.cameraZ === null) {
        this.cameraZ = Math.max(this.xDims * 3, this.yDims * 3, this.zDims * 3);
      }

      this.camera.position.set(this.cameraX, this.cameraY, this.cameraZ);

      this.scene.add(this.camera);

      this.camera.lookAt(this.meshes[0]);

      this.renderer.set;
      this.renderer.setSize(this.width, this.height);
      this.renderer.setClearColor(this.backgroundColor, 1);
    }
  }, {
    key: 'addInteractionControls',
    value: function addInteractionControls() {
      // Add controls for mouse interaction
      if (this.orbitControls) {
        this.controls = new OrbitControls(this.camera, _reactDom2.default.findDOMNode(this.component));
        this.controls.enableKeys = true;
        this.controls.addEventListener('change', this.orbitRender.bind(this));
      }
    }
  }, {
    key: 'addToReactComponent',
    value: function addToReactComponent() {
      // Add to the React Component
      _reactDom2.default.findDOMNode(this.component).replaceChild(this.renderer.domElement, _reactDom2.default.findDOMNode(this.component).firstChild);
    }

    /**
     * Animate the scene
     * @returns {void}
     */

  }, {
    key: 'animate',
    value: function animate() {
      // note: three.js includes requestAnimationFrame shim
      if (this.rotate) {
        this.animationRequestId = requestAnimationFrame(this.animate.bind(this));
      }

      if (this.orbitControls) {
        this.controls.update();
      }
      this.render();
    }

    /**
     * Render the scene after turning off the rotation
     * @returns {void}
     */

  }, {
    key: 'orbitRender',
    value: function orbitRender() {
      if (this.rotate) {
        this.rotate = false;
      }

      this.render();
    }

    /**
     * Deallocate Mesh, renderer context.
     * @returns {void}
     */

  }, {
    key: 'clean',
    value: function clean() {
      var _this3 = this;

      if (_typeof(this.meshes) === _typeof([])) {
        this.meshes.forEach(function (mesh) {
          if (_this3.scene) {
            _this3.scene.remove(mesh);
          }
          mesh.geometry.dispose();
          mesh.material.dispose();
        });
        this.meshes = [];
      }

      if (this.bedMesh) {
        if (this.scene) {
          this.scene.remove(this.bedMesh);
        }
        this.bedMesh.geometry.dispose();
        this.bedMesh.material.dispose();
        this.bedMesh = null;
      }

      if (this.axisHelper) {
        if (this.scene) {
          this.scene.remove(this.axisHelper);
        }
        this.axisHelper = null;
      }

      if (this.scene) {
        var directionalLightObj = this.scene.getObjectByName(DIRECTIONAL_LIGHT);
        if (directionalLightObj) {
          this.scene.remove(directionalLightObj);
        }
        var directionalLightObj2 = this.scene.getObjectByName(DIRECTIONAL_LIGHT + '2');
        if (directionalLightObj2) {
          this.scene.remove(directionalLightObj2);
        }
      }

      if (this.animationRequestId) {
        cancelAnimationFrame(this.animationRequestId);
      }

      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.forceContextLoss();
      }
    }

    /**
     * Render the scene
     * @returns {void}
     */

  }, {
    key: 'render',
    value: function render() {
      var _this4 = this;

      if (_typeof(this.meshes) === _typeof([]) && this.rotate) {
        this.meshes.forEach(function (mesh) {
          mesh.rotation.x += _this4.rotationSpeeds[0];
          mesh.rotation.y += _this4.rotationSpeeds[1];
          mesh.rotation.z += _this4.rotationSpeeds[2];
        });
      }

      this.renderer.render(this.scene, this.camera);
    }
  }]);

  return Paint;
}();

exports.default = Paint;
module.exports = exports['default'];