import { ShaShoBgApp } from "./shasho-bg-app"

const canvasDomElement = document.getElementById("three-app");

let app: ShaShoBgApp;

if (canvasDomElement) {
    app = new ShaShoBgApp(canvasDomElement);
    // document.body.appendChild(app.renderer.domElement);
}
else {
    app = new ShaShoBgApp();
}

/*
const nextlink = document.getElementById("next-link");
if (nextlink) {
    nextlink.addEventListener("click", (e: Event) => { app.viewer.nextArtefact(); });
}

const prevlink = document.getElementById("prev-link");
if (prevlink) {
    prevlink.addEventListener("click", (e: Event) => { app.viewer.prevArtefact(); });
}
*/