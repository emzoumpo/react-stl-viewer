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

    this.loader = new _Three2.default.STLLoader();
    this.scene = new _Three2.default.Scene();
    this.renderer = new _Three2.default.WebGLRenderer({
      antialias: true
    });
    this.reqNumber = 0;
  }

  _createClass(Paint, [{
    key: 'init',
    value: function init(context) {
      var _this = this;

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
      this.meshes = [];
      this.initialBox = new _Three2.default.Box3();

      if (_typeof(this.meshes) === _typeof([])) {
        this.meshes.forEach(function (mesh) {
          _this.scene.remove(mesh);
          mesh.geometry.dispose();
          mesh.material.dispose();
        });
      }

      var directionalLightObj = this.scene.getObjectByName(DIRECTIONAL_LIGHT);
      if (directionalLightObj) {
        this.scene.remove(directionalLightObj);
      }

      if (this.animationRequestId) {
        cancelAnimationFrame(this.animationRequestId);
      }

      //Detector.addGetWebGLMessage();
      this.distance = 10000;
      var directionalLight = new _Three2.default.DirectionalLight(this.lightColor);
      directionalLight.position.x = this.lightX;
      directionalLight.position.y = this.lightY;
      directionalLight.position.z = this.lightZ;
      directionalLight.position.normalize();
      directionalLight.name = DIRECTIONAL_LIGHT;
      this.scene.add(directionalLight);

      this.reqNumber += 1;
      this.addSTLToScene(this.reqNumber);
    }
  }, {
    key: 'addSTLToScene',
    value: function addSTLToScene(reqId) {
      var _this2 = this;

      this.loader.crossOrigin = '';
      var promises = [];
      this.urls.forEach(function (url, index) {
        promises.push(_this2.addSTLPromise(url, reqId, index));
      });

      Promise.all(promises).then(function (resolvedArray) {
        console.log(resolvedArray);
        resolvedArray.forEach(function (mesh) {
          // Set the object's dimensions
          mesh.geometry.computeBoundingBox();

          if (_this2.rotate) {
            mesh.rotation.x = _this2.rotationSpeeds[0];
            mesh.rotation.y = _this2.rotationSpeeds[1];
            mesh.rotation.z = _this2.rotationSpeeds[2];
          }

          _this2.meshes.push(mesh);
          console.log(_this2.initialBox);
          console.log(mesh.geometry.boundingBox);
          _this2.initialBox = _this2.initialBox && _this2.initialBox.union(mesh.geometry.boundingBox) || mesh.geometry.boundingBox;
        });

        var centerVector = new _Three2.default.Vector3();
        console.log('final box', _this2.initialBox);
        console.log(_this2.initialBox.center());
        _this2.initialBox.center(centerVector);

        _this2.meshes.forEach(function (mesh) {
          mesh.geometry.translate(-centerVector.x, -centerVector.y, -centerVector.z);
          _this2.scene.add(mesh);
        });

        _this2.bedMesh = new _Three2.default.Mesh(new _Three2.default.CubeGeometry(300, 300, 1), new _Three2.default.MeshNormalMaterial());

        _this2.bedMesh.geometry.center();
        _this2.bedMesh.position.z = _this2.initialBox.min.z - 1.5;

        _this2.scene.add(_this2.bedMesh);

        _this2.xDims = _this2.initialBox.max.x - _this2.initialBox.min.x;
        _this2.yDims = _this2.initialBox.max.y - _this2.initialBox.min.y;
        _this2.zDims = _this2.initialBox.max.z - _this2.initialBox.min.z;
        _this2.addCamera();
        _this2.addInteractionControls();
        _this2.addToReactComponent();

        // Start the animation
        _this2.animate();
      });
    }
  }, {
    key: 'addSTLPromise',
    value: function addSTLPromise(url, reqId, index) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3.loader.load(url, function (geometry) {
          if (_this3.reqNumber !== reqId) {
            return;
          }
          // Calculate mesh noramls for MeshLambertMaterial.
          geometry.computeFaceNormals();
          geometry.computeVertexNormals();

          // Center the object
          // geometry.center();

          var mesh = new _Three2.default.Mesh(geometry, new _Three2.default.MeshLambertMaterial({
            overdraw: true,
            color: _this3.modelColor[index % _this3.modelColor.length]
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
        this.controls.enableKeys = false;
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
      var _this4 = this;

      if (_typeof(this.meshes) === _typeof([])) {
        this.meshes.forEach(function (mesh) {
          _this4.scene.remove(mesh);
          mesh.geometry.dispose();
          mesh.material.dispose();
        });
      }

      var directionalLightObj = this.scene.getObjectByName(DIRECTIONAL_LIGHT);
      if (directionalLightObj) {
        this.scene.remove(directionalLightObj);
      }

      if (this.animationRequestId) {
        cancelAnimationFrame(this.animationRequestId);
      }
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }

    /**
     * Render the scene
     * @returns {void}
     */

  }, {
    key: 'render',
    value: function render() {
      var _this5 = this;

      if (_typeof(this.meshes) === _typeof([]) && this.rotate) {
        this.meshes.forEach(function (mesh) {
          mesh.rotation.x += _this5.rotationSpeeds[0];
          mesh.rotation.y += _this5.rotationSpeeds[1];
          mesh.rotation.z += _this5.rotationSpeeds[2];
        });
      }

      this.renderer.render(this.scene, this.camera);
    }
  }]);

  return Paint;
}();

exports.default = Paint;
module.exports = exports['default'];