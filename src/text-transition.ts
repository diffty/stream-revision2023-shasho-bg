import { randInt } from "three/src/math/MathUtils";


const RANDOM_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$^%£§&?/+=";


export class TextTransition {
    bufferA: string;
    bufferB: string;
    currBuffer: Array<string>;
    currMask: Array<string>;
    tickRate: number;
    lastTickTime: number;
    enabled: boolean;

    constructor() {
        this.bufferA = "";
        this.bufferB = "";
        this.currBuffer = [];
        this.currMask = [];
        this.tickRate = 100;
        this.lastTickTime = 0;
    }

    setText(newText: string) {
        this.bufferA = this.currBuffer.join("");
        this.bufferB = newText;
        this.currMask = ('A'.repeat(this.bufferA.length) + '?'.repeat(Math.max(0, this.bufferB.length-this.bufferA.length)) + 'X'.repeat(Math.max(0, this.bufferA.length-this.bufferB.length))).split("");
        this.enabled = true;
    }

    update() {
        if (this.getBuffer() == this.bufferB) {
            this.enabled = false;
        }
        else {
            if (Date.now() - this.lastTickTime > this.tickRate) {
                this.tick();
                this.lastTickTime = Date.now();
            }
        }
    }

    tick() {
        const charsIdxToProcess = new Array<number>;

        for (let i = 0; i < this.currMask.length; i++) {
            if (this.currMask[i] != 'B') {
                charsIdxToProcess.push(i);
            }
        }
        
        if (charsIdxToProcess) {
            const cIdx = charsIdxToProcess[randInt(0, charsIdxToProcess.length-1)];
            if (this.currMask[cIdx] == 'A') {
                this.currMask[cIdx] = 'B';
            }
            else if (this.currMask[cIdx] == 'X') {
                this.currMask[cIdx] = '';
            }
            else if (this.currMask[cIdx] == '?') {
                this.currMask[cIdx] = 'B';
            }

            this.maskBuffers();
        }
    }

    maskBuffers() {
        this.currBuffer = ' '.repeat(this.currMask.length).split("");

        for (let i = 0; i < this.currMask.length; i++) {
            if (this.currMask[i] == "A") {
                this.currBuffer[i] = this.bufferA[i];
            }
            else if (this.currMask[i] == "B") {
                this.currBuffer[i] = this.bufferB[i];
            }
            else if (this.currMask[i] == "?") {
                this.currBuffer[i] = RANDOM_CHARS[randInt(0, RANDOM_CHARS.length-1)];
            }
            else if (this.currMask[i] == "X") {
                this.currBuffer[i] = this.bufferB[i];
            }
        }
    }

    getBuffer() {
        return this.currBuffer.join("");
    }
}
