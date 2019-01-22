import THREE from './Three';
import ReactDOM from 'react-dom';
let OrbitControls = require('three-orbit-controls')(THREE);

const DIRECTIONAL_LIGHT = 'directionalLight';

class Paint {
  constructor() {
    this.loader = new THREE.STLLoader();
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.reqNumber = 0;
  }

  init(context) {
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
    this.initialBox = new THREE.Box3();

    if (typeof this.meshes === typeof []) {
      this.meshes.forEach(mesh => {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
    }

    const directionalLightObj = this.scene.getObjectByName(DIRECTIONAL_LIGHT);
    if (directionalLightObj) {
      this.scene.remove(directionalLightObj);
    }

    if (this.animationRequestId) {
      cancelAnimationFrame(this.animationRequestId);
    }

    //Detector.addGetWebGLMessage();
    this.distance = 10000;
    let directionalLight = new THREE.DirectionalLight(this.lightColor);
    directionalLight.position.x = this.lightX;
    directionalLight.position.y = this.lightY;
    directionalLight.position.z = this.lightZ;
    directionalLight.position.normalize();
    directionalLight.name = DIRECTIONAL_LIGHT;
    this.scene.add(directionalLight);

    this.reqNumber += 1;
    this.addSTLToScene(this.reqNumber);
  }

  addSTLToScene(reqId) {
    this.loader.crossOrigin = '';
    let promises = [];
    this.urls.forEach((url, index) => {
      promises.push(this.addSTLPromise(url, reqId, index));
    });

    Promise.all(promises).then(resolvedArray => {
      console.log(resolvedArray);
      resolvedArray.forEach(mesh => {
        // Set the object's dimensions
        mesh.geometry.computeBoundingBox();

        if (this.rotate) {
          mesh.rotation.x = this.rotationSpeeds[0];
          mesh.rotation.y = this.rotationSpeeds[1];
          mesh.rotation.z = this.rotationSpeeds[2];
        }

        this.meshes.push(mesh);
        console.log(this.initialBox);
        console.log(mesh.geometry.boundingBox);
        this.initialBox =
          (this.initialBox &&
            this.initialBox.union(mesh.geometry.boundingBox)) ||
          mesh.geometry.boundingBox;
      });

      let centerVector = new THREE.Vector3();
      console.log('final box', this.initialBox);
      console.log(this.initialBox.center());
      this.initialBox.center(centerVector);

      this.meshes.forEach(mesh => {
        mesh.geometry.translate(
          -centerVector.x,
          -centerVector.y,
          -centerVector.z
        );
        this.scene.add(mesh);
      });

      this.bedMesh = new THREE.Mesh(
        new THREE.CubeGeometry(300, 300, 1),
        new THREE.MeshNormalMaterial()
      );

      this.bedMesh.geometry.center();
      this.bedMesh.position.z = this.initialBox.min.z - 1.5;

      this.scene.add(this.bedMesh);

      this.xDims = this.initialBox.max.x - this.initialBox.min.x;
      this.yDims = this.initialBox.max.y - this.initialBox.min.y;
      this.zDims = this.initialBox.max.z - this.initialBox.min.z;
      this.addCamera();
      this.addInteractionControls();
      this.addToReactComponent();

      // Start the animation
      this.animate();
    });
  }

  addSTLPromise(url, reqId, index) {
    return new Promise((resolve, reject) => {
      this.loader.load(url, geometry => {
        if (this.reqNumber !== reqId) {
          return;
        }
        // Calculate mesh noramls for MeshLambertMaterial.
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        // Center the object
        // geometry.center();

        const mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshLambertMaterial({
            overdraw: true,
            color: this.modelColor[index % this.modelColor.length]
          })
        );

        resolve(mesh);
      });
    });
  }

  addCamera() {
    // Add the camera
    this.camera = new THREE.PerspectiveCamera(
      30,
      this.width / this.height,
      1,
      this.distance
    );

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

  addInteractionControls() {
    // Add controls for mouse interaction
    if (this.orbitControls) {
      this.controls = new OrbitControls(
        this.camera,
        ReactDOM.findDOMNode(this.component)
      );
      this.controls.enableKeys = false;
      this.controls.addEventListener('change', this.orbitRender.bind(this));
    }
  }

  addToReactComponent() {
    // Add to the React Component
    ReactDOM.findDOMNode(this.component).replaceChild(
      this.renderer.domElement,
      ReactDOM.findDOMNode(this.component).firstChild
    );
  }

  /**
   * Animate the scene
   * @returns {void}
   */
  animate() {
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
  orbitRender() {
    if (this.rotate) {
      this.rotate = false;
    }

    this.render();
  }

  /**
   * Deallocate Mesh, renderer context.
   * @returns {void}
   */
  clean() {
    if (typeof this.meshes === typeof []) {
      this.meshes.forEach(mesh => {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
    }

    const directionalLightObj = this.scene.getObjectByName(DIRECTIONAL_LIGHT);
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
  render() {
    if (typeof this.meshes === typeof [] && this.rotate) {
      this.meshes.forEach(mesh => {
        mesh.rotation.x += this.rotationSpeeds[0];
        mesh.rotation.y += this.rotationSpeeds[1];
        mesh.rotation.z += this.rotationSpeeds[2];
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}

export default Paint;
