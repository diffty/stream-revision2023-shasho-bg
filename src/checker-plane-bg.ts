import * as THREE from "three";
import { ShaderMaterial } from "three";


export class CheckerPlaneBg extends THREE.Mesh {
    startTime: number;
    material: ShaderMaterial;
    stencilId: number;

    constructor() {
        const bgVertexShader = `
            varying vec2 vUv;

            void main()	{
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `
        
        const bgFragmentShader = `
            varying vec2 vUv;
            uniform vec2 resolution;
            uniform sampler2D tex;
            uniform float time;
            uniform vec4 color1;
            uniform vec4 color2;
            uniform float speed;
            uniform float angle;
            uniform vec2 cell;

            vec2 rotate(vec2 v, float angle) {
                return mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * v;
            }

            vec2 repeat(vec2 v, float repeatX, float repeatY) {
                return vec2(mod(v.x * repeatX, 1.0), mod(v.y * repeatY, 1.0));
            }

            float checker(vec2 v) {
                float cX = step(0.5, v.x);
                float cY = step(0.5, v.y);
                return cX*(1.-cY)+cY*(1.-cX);
            }

            vec4 color(float c, vec4 c1, vec4 c2) {
                return c1*c + c2*(1.-c);
            }

            float incrustImg(sampler2D t, float c, vec2 v, vec2 size, vec2 cell) {
                v = v / vec2(size.x, size.y) + vec2(1. / size.x * cell.x, 1. / size.y * cell.y);
                
                return texture2D(tex, v).x;
            }

			void main() {
                float ratio = resolution.x / resolution.y;
                vec2 vUv2 = vec2(vUv.x * ratio, vUv.y);
                vUv2 = rotate(vUv2, angle);
                vUv2 = repeat(vUv2, 9., 9.);
                vUv2 = vec2(
                    mod((vUv2.x + time * speed), 1.),
                    mod((vUv2.y + time * speed), 1.));
                
                float c = checker(vUv2);
                float i = incrustImg(tex, c, mod(vUv2*2., 1.), vec2(3., 3.), cell);
                c = c*(1.-i) + (1.-c)*i;
                vec4 clr = color(c, color1, color2);
                gl_FragColor.rgba = clr;
			}
        `

        const material = new THREE.ShaderMaterial({
            uniforms: {
                'tex': { value: null },
                'time': { value: 0.0 },
                'speed': { value: 1.0 },
                'angle': { value: 0.1 },
                'color1': { value: [0.1, 0.8, 0.2, 1.] },
                'color2': { value: [0.1, 0., 0., 1.] },
                'cell': { value: [0., 0.] },
                'resolution': { value: [window.innerWidth, window.innerHeight] }
            },
            fragmentShader: bgFragmentShader,
            vertexShader: bgVertexShader,
        });

        const geometry = new THREE.PlaneGeometry();

        super(geometry, material);

        this.startTime = Date.now();
        this.stencilId = 0;

        const shaderTex = new THREE.TextureLoader().load("./bg-icons.png", (t) => {
            this.material.uniforms.tex.value = t;
        });
        
        this.material.stencilWrite = true;
        this.material.stencilRef = this.stencilId;
        const ratio = window.innerWidth / window.innerHeight
        this.scale.set(ratio*9, 9, 1);
        this.translateZ(-5);

        this.setStencilId(1);
    }

    update(deltaTime: number) {
        this.material.uniforms.time.value += deltaTime*0.5;
    }

    setStencilId(newStencilId: number) {
        this.stencilId = newStencilId;
        this.updateStencilId();
    }

    updateStencilId() {
        this.material.stencilWrite = true;
        this.material.stencilRef = this.stencilId;
        this.material.stencilFunc = THREE.EqualStencilFunc;
    }

    onWindowResize() {
        const ratio = window.innerWidth / window.innerHeight
        this.scale.set(ratio*9, 9, 1);
        this.material.uniforms.resolution.value = [window.innerWidth, window.innerHeight];
    }
}
