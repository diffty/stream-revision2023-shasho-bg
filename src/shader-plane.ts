import * as THREE from "three";
import { ShaderMaterial } from "three";
import { Title3dSystem } from "./title3d";


export class ShaderPlane extends THREE.Mesh {
    startTime: number;
    material: ShaderMaterial;
    stencilId: number;
    title3dSystem: Title3dSystem;
    textRoot: THREE.Object3D;

    constructor() {
        const bgVertexShader = `
            varying vec2 v_texcoord;

            void main()	{
                v_texcoord = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `
        
        const bgFragmentShader = `
            #ifdef GL_ES
            precision highp float;
            #endif
            
            uniform float time;
            uniform vec2 resolution;
            uniform vec2 mouse;
            uniform vec3 spectrum;
            
            uniform sampler2D texture0;
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform sampler2D texture3;
            uniform sampler2D prevFrame;
            uniform sampler2D prevPass;
            
            varying vec3 v_normal;
            varying vec2 v_texcoord;
            
            
            // 2D Random
            float random (in vec2 st) {
                return fract(sin(dot(st.xy,
                                    vec2(12.9898,78.233)))
                            * 43758.5453123);
            }
            
            // 2D Noise based on Morgan McGuire @morgan3d
            // https://www.shadertoy.com/view/4dS3Wd
            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
            
                // Four corners in 2D of a tile
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
            
                // Smooth Interpolation
            
                // Cubic Hermine Curve.  Same as SmoothStep()
                vec2 u = f*f*(3.0-2.0*f);
                // u = smoothstep(0.,1.,f);
            
                // Mix 4 coorners percentages
                return mix(a, b, u.x) +
                        (c - a)* u.y * (1.0 - u.x) +
                        (d - b) * u.x * u.y;
            }
            
            float ball(vec3 currPos, vec3 ballPos, float radius) {
                return length(currPos - ballPos) - radius;
            }
            
            
            vec3 rotateZ(vec3 pos, float z) {
                mat3 rotMatZ = mat3( cos(z), -sin(z), 0.,
                                    sin(z),  cos(z), 0.,
                                    0.,      0.,     1.);
                    
                return (pos * rotMatZ);
            }
                                    
            vec3 rotateY(vec3 pos, float y) {
                mat3 rotMatY = mat3( cos(y), 0., sin(y),
                                    0.,     1., 0.,
                                    -sin(y), 0., cos(y));
                    
                return (pos * rotMatY);
            }
                                    
            vec3 rotateX(vec3 pos, float x) {
                mat3 rotMatX = mat3(1.,     0.,     0.,
                                    0., cos(x), sin(x),
                                    0.,-sin(x), cos(x));
                    
                return (pos * rotMatX);
            }
            
            void main(void)
            {
                vec2 uv = -1. + 2. * v_texcoord;
                float ratio = resolution.x / resolution.y;
                float c = 0.;
                
                float near = 1.0;
                
                vec3 dir = vec3(uv.x * ratio, uv.y, near);
                
                float nStep = 0.;
                
                float totalDist = 0.;
                
                while (nStep < 32.) {
                    vec3 currPos = totalDist * dir;
                    
                    currPos.y += abs(sin(time)*2.);
                    
                    currPos = rotateX(currPos, 1.);
                    
                    currPos.x = mod(currPos.x, 1.0);
                    currPos.y = mod(currPos.y, 1.0);
                    
                    float dist = ball(currPos, vec3(0.5, 0.5, 5.), .2);
                    
                    if (dist < 0.001) {
                        //c = totalDist * 0.1;
                        c = 1.0;
                        break;
                    }
                    
                    if (totalDist > 10000.) {
                        break;
                    }
                    
                    nStep++;
                    
                    totalDist += dist;
                }
                
                gl_FragColor = vec4(c, c, c, 1.0);
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
        
        this.material.stencilWrite = true;
        this.material.stencilRef = this.stencilId;

        this.textRoot = new THREE.Object3D();
        this.add(this.textRoot);

        this.title3dSystem = new Title3dSystem(this.textRoot);
        
        let testTitle = new THREE.Object3D();
        testTitle.name = "T3D_Test";
        testTitle.translateZ(5);
        this.textRoot.add(testTitle);
        
        const ratio = window.innerWidth / window.innerHeight
        this.scale.set(ratio*9, 9, 1);
        this.translateZ(-5);
    }

    update(deltaTime: number) {
        this.material.uniforms.time.value += deltaTime;
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
