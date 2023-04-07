import * as THREE from "three";
import { readTextFile } from "./utils";
import { ArtefactBase } from "./artefactbase";
import { ArtefactData } from "./artefactdata";
import { StencilShutter } from "./stencilshutter";
import { CheckerPlaneBg } from "./checker-plane-bg";
import { randInt } from "three/src/math/MathUtils";


export class ArtefactViewer extends THREE.Group {
    artefacts: Array<ArtefactBase>;
    currArtefact: ArtefactBase;
    artefactsToLoad: number; 
    shutter: StencilShutter;
    currStencilId: number;
    rotateSpeed: number;
    backgrounds: CheckerPlaneBg[];
    logoGridSize: number[];
    nbLogo: number;

    constructor(rotateSpeed?: number) {
        super();
        this.backgrounds = [];
        this.artefacts = [];
        this.artefactsToLoad = 2;
        this.currStencilId = 1;
        this.logoGridSize = [3, 3];
        this.nbLogo = 9;
        this.rotateSpeed = (rotateSpeed != undefined) ? rotateSpeed : 5;

        this.loadArtefactsDataFromUrl("artefacts.json");

        this.shutter = new StencilShutter();
        this.add(this.shutter);

        this.backgrounds.push(new CheckerPlaneBg());
        this.backgrounds[0].setStencilId(1);
        this.setBackgroundProperties(0, [0.1, 0.2, 0.7, 1.0], [1.0, 0.2, 0.7, 1.0], [1., 1.])
        this.add(this.backgrounds[0]);

        this.backgrounds.push(new CheckerPlaneBg());
        this.backgrounds[1].setStencilId(2);
        this.setBackgroundProperties(1, [1.0, 1.0, 0.7, 1.0], [0.1, 0.2, 0.7, 1.0], [0., 0.])
        this.add(this.backgrounds[1]);
    }
    
    loadArtefactsDataFromUrl(url: string) {
        readTextFile(url, (rawData) => {
            let data: Array<ArtefactData>;

            try {
                data = JSON.parse(rawData);
            } catch (error) {
                throw `Bad artifact data retrieved from URL ${url}:\n${rawData}`;
            }
            
            this.processArtefactsData(data);
        });
    }

    processArtefactsData(artefactsData: Array<ArtefactData>) {
        artefactsData.forEach(element => {
            const newArtefact = new ArtefactBase(element);
            this.artefacts.push(newArtefact);
        });

        if (this.artefacts.length > 0) {
            this.currArtefact = this.artefacts[0]
            
            for (let i = 0; i < this.artefacts.length /*Math.min(this.artefactsToLoad, this.artefacts.length)*/; i++) {
                this.artefacts[i].visible = false;

                this.loadArtefact(this.artefacts[i])
                    .then((a: ArtefactBase) => {
                        if (a == this.currArtefact) {
                            this.showArtefact(a, this.currStencilId);
                        }
                        //this.showArtefact(a, (i % 2) + 1); // Attention on affiche tout là
                    });
            }
        }
    }

    loadArtefact(artefact: ArtefactBase): Promise<ArtefactBase> {
        return new Promise<ArtefactBase>(resolve => {
            artefact.load((a: ArtefactBase) => {
                this.add(artefact);
                resolve(a);
            });
        });
    }

    showArtefact(artefact: ArtefactBase, stencilId?: number) {
        if (!artefact.isLoaded()) {
            throw `Trying to show this unloaded artefact ${artefact.name}`;
        }

        artefact.visible = true;

        if (stencilId != undefined) {
            artefact.setStencilId(stencilId);
            let color1 = artefact.data.color1;
            let color2 = artefact.data.color2;
            let logo = artefact.data.logo;

            if (color1 == undefined) {
                color1 = [1.0, 0.0, 0.0, 1.0];
            }

            if (color2 == undefined) {
                color2 = [0.0, 1.0, 0.0, 1.0];
            }

            if (logo == undefined) {
                logo = randInt(0, this.nbLogo-1);
            }
            
            if (stencilId % 2 == 1) {
                const tmpColorSwap = color1;
                color1 = color2;
                color2 = tmpColorSwap;
            }

            this.setBackgroundProperties(
                stencilId-1,
                color1,
                color2,
                this.logoGridPos(logo));
        }
    }

    hideArtefact(artefact: ArtefactBase) {
        artefact.visible = false;
    }

    logoGridPos(logoNb: number) {
        const x = Math.floor(logoNb % this.logoGridSize[0]);
        const y = Math.floor(logoNb / this.logoGridSize[0]);
        return [x, y];
    }

    update(deltaTime: number) {
        this.shutter.update(deltaTime);
        if (this.currArtefact) {
            //this.currArtefact.update(deltaTime);
        }

        for (let i = 0; i < this.backgrounds.length; i++) {
            this.backgrounds[i].update(deltaTime);
        }
    }

    prevArtefact() {
        const currArtefactIdx = this.artefacts.indexOf(this.currArtefact);
        
        if (currArtefactIdx - 1 < 0) {
            this.currArtefact = this.artefacts[(this.artefacts.length-1)];
        }
        else {
            this.currArtefact = this.artefacts[currArtefactIdx - 1];
        }

        this.currStencilId--;

        if (this.currStencilId < 1) {
            this.currStencilId = 2;
        }

        this.artefacts.forEach((a) => {
            if (a.stencilId == this.currStencilId) {
                this.hideArtefact(a);
            }
        })

        this.showArtefact(this.currArtefact, this.currStencilId);

        this.shutter.moveLeft();
    }

    nextArtefact() {
        const currArtefactIdx = this.artefacts.indexOf(this.currArtefact);
        this.currArtefact = this.artefacts[(currArtefactIdx+1) % this.artefacts.length];
        this.currStencilId = ((this.currStencilId) % 2)+1
        
        this.artefacts.forEach((a) => {
            if (a.stencilId == this.currStencilId) {
                this.hideArtefact(a);
            }
        })

        this.showArtefact(this.currArtefact, this.currStencilId);

        this.shutter.moveRight();
    }

    getArtefactStencilId(artefact: ArtefactBase) {
        const artefactIdx = this.artefacts.indexOf(artefact);
        return (artefactIdx % 2) + 1;
    }

    onDrag(moveDelta: THREE.Vector2) {
        // this.shutter.setShutterPosition(this.shutter.getShutterPosition() + moveDelta.x);
        this.currArtefact.obj?.rotateY(moveDelta.x * this.rotateSpeed);
    }

    setBackgroundProperties(bgId: number, color1?: number[], color2?: number[], cell?: number[]) {
        if (color1) {
            while (color1.length < 4) {
                color1.push(1.0);
            }
            this.backgrounds[bgId].material.uniforms.color1.value = color1;
        }

        if (color2) {
            while (color2.length < 4) {
                color2.push(1.0);
            }
            this.backgrounds[bgId].material.uniforms.color2.value = color2;
        }

        if (cell != undefined) {
            this.backgrounds[bgId].material.uniforms.cell.value = cell;
        }
    }

    onWindowResize() {
        const ratio = (window.innerWidth / window.innerHeight);
        
        this.shutter.mainPlane.scale.set(ratio, 1, this.shutter.mainPlane.scale.z);
        this.shutter.topPlane.scale.set(ratio, 1, this.shutter.mainPlane.scale.z);

        this.shutter.leftEdge.position.set(-ratio * 0.5, 0, 0);
        this.shutter.rightEdge.position.set(ratio * 0.5, 0, 0);

        for (let i = 0; i < this.backgrounds.length; i++) {
            this.backgrounds[i].onWindowResize();
        }
    }
}
