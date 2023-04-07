import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";


export class StencilShutter extends THREE.Group {
    mainPlane: THREE.Mesh;
    topPlane: THREE.Mesh;
    leftEdge: THREE.Group;
    rightEdge: THREE.Group;
    leftShadowIn: THREE.Mesh;
    leftShadowOut: THREE.Mesh;
    rightShadowIn: THREE.Mesh;
    rightShadowOut: THREE.Mesh;
    topGroup: THREE.Group;
    shutterPosition: number;
    shutterTargetPosition: number;
    animTarget: number;
    animValue: number;

    constructor() {
        super();

        const planeGeometry = new THREE.PlaneGeometry(1, 1);

        const planesWidth = window.innerWidth / window.innerHeight;

        this.mainPlane = new THREE.Mesh(planeGeometry, this.makeStencilMaterial(1));
        this.mainPlane.scale.set(planesWidth, 1., this.mainPlane.scale.z);

        this.topGroup = new THREE.Group();

        this.topPlane = new THREE.Mesh(planeGeometry, this.makeStencilMaterial(2));
        this.topPlane.scale.set(planesWidth, 1., this.mainPlane.scale.z);
        this.topPlane.renderOrder = 0;

        this.topGroup.add(this.topPlane);

        this.shutterPosition = 0;
        this.shutterTargetPosition = 0;

        this.animTarget = -1;
        this.animValue = -1;

        this.setShutterPosition(-1);

        this.add(this.mainPlane);
        this.add(this.topGroup);
        
        const gltfLoader = new GLTFLoader();

        gltfLoader.load(
            "./mask-edge.gltf",
            (gltf) => {
                gltf.scene.traverse((o: THREE.Object3D) => {
                    if (o instanceof THREE.Mesh) {
                        if (o.name == "ShadowIn") {
                            o.visible = false;
                            o.material.stencilWrite = true;
                            o.material.stencilRef = 1;
                            o.material.stencilFunc = THREE.EqualStencilFunc;
                            this.leftShadowIn = o
                        }
                        else if (o.name == "ShadowOut") {
                            o.visible = false;
                            o.material.stencilWrite = true;
                            o.material.stencilRef = 2;
                            o.material.stencilFunc = THREE.EqualStencilFunc;
                            this.leftShadowOut = o
                        }
                        else if (o.name == "Debug") {
                            o.visible = false;
                            o.material = this.topPlane.material;
                        }
                        else {
                            o.material = this.topPlane.material;
                        }
                    }
                });

                this.leftEdge = gltf.scene;
                this.rightEdge = this.leftEdge.clone();

                this.rightEdge.traverse((o: THREE.Object3D) => {
                    if (o instanceof THREE.Mesh) {
                        if (o.name == "ShadowIn") {
                            this.rightShadowIn = o
                        }
                        else if (o.name == "ShadowOut") {
                            this.rightShadowOut = o
                        }
                    }
                });
                
                this.topGroup.add(this.leftEdge);
                this.topGroup.add(this.rightEdge);
                
                this.leftEdge.position.set(-planesWidth * 0.5, 0, 0);
                this.rightEdge.position.set(planesWidth * 0.5, 0, 0);
                this.rightEdge.scale.set(-1., 1., 1.);
                //this.rightEdge.rotateZ(Math.PI);
            });
    }

    getShutterPosition() {
        const edgeSize = 0.050;
        return this.topGroup.position.x / (this.mainPlane.scale.x + edgeSize);
    }

    setShutterPosition(newX: number) {
        const edgeSize = 0.050;

        // Alter input value so it loops
        if (newX < -1) {
            newX += (Math.floor(Math.abs((newX-1) / 2))) * 2;
        }
        else {
            newX = ((newX + 1) % 2) - 1;
        }

        this.topGroup.position.set(newX * (this.mainPlane.scale.x + edgeSize), 0., 0.);
    }

    update(deltaTime: number) {
        const speed = 5;

        const moveValue = (this.animTarget - this.animValue) * deltaTime * speed;

        if (Math.floor(this.animValue) != Math.floor(this.animValue + moveValue)) {
            console.log(this.animValue);
            console.log(moveValue);
            if (moveValue > 0) {
                this.leftShadowIn.visible = true;
                this.rightShadowIn.visible = false;
                this.leftShadowOut.visible = false;
                this.rightShadowOut.visible = true;
            }
            else if (moveValue < 0) {
                this.leftShadowIn.visible = false;
                this.rightShadowIn.visible = true;
                this.leftShadowOut.visible = true;
                this.rightShadowOut.visible = false;
            }
        }

        //this.translateX(moveValue);
        this.animValue += moveValue;
        
        if (Math.abs(this.animTarget - this.animValue) < 0.001) {
            //this.translateX(this.animTarget - this.animValue);
            //this.animTarget = ((this.animTarget + 1) % 2) - 1;
            this.animValue = this.animTarget;
        }

        //console.log(`${this.animValue} | ${this.animTarget}`)

        this.setShutterPosition(this.animValue);
    }

    makeStencilMaterial(stencilId: number) {
        const planeMaterial = new THREE.MeshBasicMaterial({
            depthWrite: false,
            stencilWrite: true,
            stencilRef: stencilId,
            stencilFunc: THREE.AlwaysStencilFunc,
            stencilZPass: THREE.ReplaceStencilOp,
            color: 0x000000,
            colorWrite: false
        });

        return planeMaterial
    }

    moveLeft() {
        this.animTarget += 1;
    }

    moveRight() {
        this.animTarget -= 1;
    }

}
