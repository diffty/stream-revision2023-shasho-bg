import * as THREE from "three";


export class App {
    then: number;

    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    prevPointerPosition: THREE.Vector2;
    pointerIsDown: boolean;
    pointerPosition: THREE.Vector2;
    pointerDragStart: THREE.Vector2;
    isFirstTouchFrame: boolean;

    constructor(canvasDomElement?: HTMLElement) {
        this.then = 0.;

        // Event handling
        this.pointerIsDown = false;
        this.pointerPosition = new THREE.Vector2();
        this.pointerDragStart = new THREE.Vector2();
        this.prevPointerPosition = new THREE.Vector2();
        this.isFirstTouchFrame = false;

        window.addEventListener('pointermove', (e) => { this.onPointerMove(e) });
        window.addEventListener('mousedown', (e) => { this.onPointerDown(e) });
        window.addEventListener('mouseup', (e) => { this.onPointerUp(e) });
        window.addEventListener('touchstart', (e) => { this.onPointerDown(e) });
        window.addEventListener('touchend', (e) => { this.onPointerUp(e) });

        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvasDomElement,
            alpha: true,
            antialias: true
        });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.init()

        this.renderer.setAnimationLoop((now: number) => { this.appUpdate(now) })
    }

    appUpdate(now: number) {
        now *= 0.001;

        const deltaTime = now - this.then;
        this.then = now;

        this.update(deltaTime);

        if (this.scene && this.camera) {
            this.beforeRender();
            this.renderer.render(this.scene, this.camera);
            this.afterRender();
        }
    }

    init() {
        // Override this method in order to init stuff 
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.scene.add(this.camera);
    }

    update(deltaTime: number) {
        // Override this method in order to put the things to update at each frame 
    }

    beforeRender() {
        // Override this method in order to do thing just before rendering the current frame
    }

    afterRender() {
        // Override this method in order to do thing just after rendering the current frame
    }

    onDrag(moveDelta: THREE.Vector2) {
        // Override this method to customize behavior during mouse/touch drag event
    }

    onStartDrag(position: THREE.Vector2) {
        // Override this method to customize behavior when a touch/click action starts
    }

    onEndDrag(position: THREE.Vector2) {
        // Override this method to customize behavior when a touch/click action ends
    }

    onPointerMove(event: TouchEvent) {
        // calculate pointer position in normalized device coordinates
        // (-1 to +1) for both components

        this.pointerPosition = this.getNormalizedPointerPosition(event);

        if (this.pointerIsDown) {
            this.onDrag(new THREE.Vector2(this.pointerPosition.x - this.prevPointerPosition.x,
                                          this.pointerPosition.y - this.prevPointerPosition.y));

            this.prevPointerPosition = new THREE.Vector2(this.pointerPosition.x, this.pointerPosition.y);
        }
    }
    
    onPointerDown(event: TouchEvent) {
        if (event.type == "touchstart") {
            const touch = event.touches[0];

            this.pointerPosition = this.getNormalizedPointerPosition(touch);
        }
        
        this.prevPointerPosition = new THREE.Vector2(this.pointerPosition.x, this.pointerPosition.y);

        this.pointerIsDown = true;
        this.pointerDragStart = new THREE.Vector2(this.pointerPosition.x, this.pointerPosition.y);
        this.isFirstTouchFrame = true;

        this.onStartDrag(this.pointerPosition);
    }
    
    onPointerUp(event: TouchEvent) {
        this.pointerIsDown = false;
        this.isFirstTouchFrame = false;
        
        this.pointerPosition = this.getNormalizedPointerPosition(event);

        this.onEndDrag(this.pointerPosition);
    }

    getNormalizedPointerPosition(event): THREE.Vector2 {
        return new THREE.Vector2(
            (event.clientX / window.innerWidth ) * 2 - 1,
            - ( event.clientY / window.innerHeight ) * 2 + 1);
    }
}
