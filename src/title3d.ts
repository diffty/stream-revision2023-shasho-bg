import * as THREE from 'three';

import { Systems } from './systems'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { Tween, Easing } from '@tweenjs/tween.js';

// @ts-ignore
import fontPath from '../assets/fonts/Futura_Std_Book_Bold.jsonfont';

const loader = new FontLoader();


// TODO:
// - Animation fade in/fade out au changement de titre/apparition/disparition d'une source texte


class TextInfo {
    locatorObj: THREE.Mesh | null;
    threeTextObj: THREE.Mesh | null;
    obsTextObj: any;
    name: string;
    text: string;
    textSize: number;
    
    constructor(locatorObj: THREE.Mesh, name: string) {
        this.locatorObj = locatorObj;
        this.threeTextObj = null;
        this.obsTextObj = null;
        this.name = name;
        this.text = "";
        this.textSize = 80;
    }
}


export class Title3dSystem {
    rootObj: THREE.Object3D;
    textList: TextInfo[];
    group: THREE.Group;

    constructor(rootObj: THREE.Object3D) {
        this.rootObj = rootObj;
        this.textList = [];

        this.group = new THREE.Group();

        this.searchForLocators();
    }

    setRootObj(rootObj: THREE.Object3D) {
        this.rootObj = rootObj;
        this.searchForLocators();
    }

    parseName(name: string) {
        let splittedName = name.split("_");

        if (splittedName.length >= 2) {
            let tag = splittedName[0];
            let name = splittedName[1];
            
            if (tag.toLowerCase() == "t3d") {
                return name;
            }
        }
        return null;
    }

    parseFontSize(name: string) {
        let splittedName = name.split("_");
        if (splittedName.length >= 4) {
            let tag = splittedName[0];
            let name = splittedName[1];
            let fontSize = parseInt(splittedName[2]);
            
            if (!Number.isNaN(fontSize)) {
                return fontSize;
            }
        }
        return null;
    }

    searchForLocators() {
        this.textList = [];

        if (this.rootObj) {
            this.rootObj.traverse((o: THREE.Mesh) => {
                let name = this.parseName(o.name);

                if (name != null) {
                    var textInfo = new TextInfo(o, name);
                    this.textList.push(textInfo);
                }
            });
        }
    }

    flushTextInfoObsSources() {
        this.textList.forEach((textInfo: TextInfo) => {
            textInfo.obsTextObj = null;
            textInfo.text = "";
        });
    }

    searchForObsSources() {
        //this.flushTextInfoObsSources();

        var obsoleteThreeObjList = this.textList.map((t) => { return t.threeTextObj; }).filter((o) => { return o != null; });
        var sceneItemPremises: any[] = [];

        Systems.obs.send('GetSceneItemList').then((r: any) => {
            r.sceneItems.forEach((item: any) => {
                if (item.sourceKind == "text_gdiplus_v2") {
                    let name = this.parseName(item.sourceName);
                    let fontSize = this.parseFontSize(item.sourceName);

                    if (name != null) {
                        this.textList.forEach((textInfo) => {
                            if (textInfo.name.toLowerCase() == name.toLowerCase()) {
                                textInfo.obsTextObj = item;

                                var premise = Systems.obs.send('GetTextGDIPlusProperties', {
                                    "source": item.sourceName
                                }).then((p: any) => {
                                    if (textInfo.text == p.text && textInfo.threeTextObj) {
                                        let threeObjIdx = obsoleteThreeObjList.findIndex((elmt) => {
                                            return textInfo.threeTextObj == elmt
                                        });

                                        obsoleteThreeObjList.splice(threeObjIdx, 1);
                                        return;
                                    }

                                    textInfo.text = p.text;
                                    if (fontSize != null) {
                                        textInfo.textSize = fontSize;
                                    }
                                    else {
                                        textInfo.textSize = 80;
                                    }
                                    
                                    console.log(`Creating ${textInfo.text}`);
                                    this.onNewText(textInfo);
                                })
                                
                                console.log(premise);

                                sceneItemPremises.push(premise);
                            }
                        });
                    }
                }
            })
        })
        .then(() => {
            console.log("Waiting", obsoleteThreeObjList);

            Promise.all(sceneItemPremises).then(() => {
                console.log("Finished", obsoleteThreeObjList);
            
                obsoleteThreeObjList.forEach((threeObj: THREE.Mesh) => {
                    this.textList.filter((textInfo: TextInfo) => { return textInfo.threeTextObj == threeObj; })
                        .forEach((textInfo: TextInfo) => { textInfo.threeTextObj = null; });
                    this.destroyObj(threeObj);
                })
                obsoleteThreeObjList = [];
            });
        });
    }

    destroyObj(obj: THREE.Mesh) {
        const tween = new Tween(obj.material)
            .to({opacity: 0}, 500)
            .easing(Easing.Quadratic.Out)
            .start()
            .onComplete(() => {
                console.log(`Deleting ${obj}`);
                this.group.remove(obj);
            });
    }

    onNewText(textInfo: TextInfo) {
        this.createText(textInfo);
    }

    createText(textInfo: TextInfo) {
        loader.load( fontPath, (font) => {
            let txtGeometry = new TextGeometry(textInfo.text, {
                font: font,
                size: textInfo.textSize,
                height: 2. * textInfo.textSize / 40.,
                curveSegments: 10,
                bevelEnabled: true,
                bevelThickness: 0.1,
                bevelSize: 0.1,
                bevelOffset: 0,
                bevelSegments: 2
            });
            
            txtGeometry.computeVertexNormals();
            txtGeometry.computeBoundingBox();

            if (txtGeometry.boundingBox) {
                const centerOffset = - 0.5 * ( txtGeometry.boundingBox.max.x - txtGeometry.boundingBox.min.x );
                
                let material = new THREE.MeshStandardMaterial({
                    color: 0x48C7F7,  //0x7ED7F8
                    emissive: 0x0A0A0A,
                    transparent: true,
                    fog: false,
                    opacity: 0});
                
                let txtMesh = new THREE.Mesh( txtGeometry, material );

                //txtMesh.castShadow = true;
                txtMesh.receiveShadow = true;

                txtMesh.position.x = textInfo.locatorObj.position.x + centerOffset;
                txtMesh.position.y = textInfo.locatorObj.position.y;
                txtMesh.position.z = textInfo.locatorObj.position.z;

                txtMesh.rotation.x = textInfo.locatorObj.rotation.x;
                txtMesh.rotation.y = textInfo.locatorObj.rotation.y;
                txtMesh.rotation.z = textInfo.locatorObj.rotation.z;
                
                this.group.add(txtMesh);

                textInfo.threeTextObj = txtMesh;

                const tween = new Tween(material)
                    .to({opacity: 1}, 500)
                    .easing(Easing.Quadratic.Out)
                    .start();
            }
            else {
                console.error(`Object ${txtGeometry} has no bounding box!`);
            }
        });
    }
}
