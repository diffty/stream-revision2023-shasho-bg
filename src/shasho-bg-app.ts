import * as THREE from "three";
import { App } from "./app"
import { ShaderPlane } from "./shader-plane";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import { getUrlVars } from "./utils"


export class ShaShoBgApp extends App {
    rimLight: THREE.DirectionalLight;
    keyLight: THREE.DirectionalLight;
    fillLight: THREE.DirectionalLight;
    ambLight: THREE.AmbientLight;
    shaderPlane: ShaderPlane;
    obj: THREE.Group;

    init() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

        const orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        orbitControls.mouseButtons = {
            MIDDLE: THREE.MOUSE.ROTATE,
        }

        this.rimLight = new THREE.DirectionalLight(0xFFFFFF, 1); // 1
        this.keyLight = new THREE.DirectionalLight(0xFFFFFF, 1); // 1
        this.fillLight = new THREE.DirectionalLight(0xFFFFFF, 0.8); // 1
        this.ambLight = new THREE.AmbientLight(0xFFFFFF, 0);   // 0.8
        
        this.rimLight.position.set(-5, 0, -3);
        this.keyLight.position.set(-2, 0, 3);
        this.fillLight.position.set(5, 0, 1.5);

        this.scene.add(this.camera);
        this.scene.add(this.rimLight);
        this.scene.add(this.keyLight);
        this.scene.add(this.fillLight);
        this.scene.add(this.ambLight);

        this.shaderPlane = new ShaderPlane();
        
        this.scene.add(this.shaderPlane);

        this.camera.translateZ(0);

        window.addEventListener('resize', () => { this.onWindowResize(); });
        window.addEventListener('keydown', (e) => { this.onKeyDown(e); });

        console.log(getUrlVars());
    }

    update(deltaTime: number) {
        // Don't forget to manually update all objects here
        this.shaderPlane.update(deltaTime);
    }

    onDrag(moveDelta: THREE.Vector2): void {
        
    }

    onKeyDown(e) {
        
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
