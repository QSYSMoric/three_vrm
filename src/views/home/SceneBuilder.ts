import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { AmbientLight, LineBasicMaterial } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

export default class SceneBuilder {
    root: HTMLElement;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    material: LineBasicMaterial;
    ambientLight: AmbientLight;
    light: THREE.DirectionalLight;

    constructor(root: HTMLElement, width: number, height: number) {
        this.root = root;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.autoClearColor = true;
        this.scene.background = new THREE.Color(0xffff);
        this.light = new THREE.DirectionalLight(0xffffff, Math.PI);
        this.cameraSetup();
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.screenSpacePanning = true;
        this.controls.target.set(0.0, 1.0, 0.0);
        this.controls.update();
        this.light.position.set(1.0, 1.0, 1.0).normalize();
        this.scene.add(this.light);
        this.draw();
        this.root.appendChild(this.renderer.domElement);
    }

    //准备画布
    cameraSetup() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000,
        );
        this.camera.position.set(0.0, 1.0, 5.0);
        this.camera.lookAt(0, 0, 0);
    }

    async draw() {
        let currentVrm: { scene: THREE.Object3D<THREE.Event> } | undefined = undefined;
        const loader = new GLTFLoader();

        loader.register((parser) => {
            return new VRMLoaderPlugin(parser);
        });

        loader.loadAsync("src/assets/models/nan.vrm").then((gltf) => {
            const vrm = gltf.userData.vrm;

            // calling these functions greatly improves the performance
            VRMUtils.removeUnnecessaryVertices(gltf.scene);
            VRMUtils.removeUnnecessaryJoints(gltf.scene);

            if (currentVrm) {
                this.scene.remove(currentVrm.scene);
                VRMUtils.deepDispose(currentVrm.scene);
            }

            // Disable frustum culling
            vrm.scene.traverse((obj: { frustumCulled: boolean }) => {
                obj.frustumCulled = false;
            });

            currentVrm = vrm;
            this.scene.add(vrm.scene);
        });

        // helpers
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);

        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
    }

    render = () => {
        requestAnimationFrame(this.render);
        this.renderer.render(this.scene, this.camera);
        this.controls.update();
    };
}
