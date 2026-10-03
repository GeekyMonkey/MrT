import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.querySelector<HTMLCanvasElement>("#bg");
const secondSection = document.querySelector<HTMLElement>(".section-two");

if (!canvas || !secondSection) {
  throw new Error("The 3D canvas and second content section are required.");
}

const scrollSection = secondSection;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 0, 9);

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.HemisphereLight(0xffe6b0, 0x342635, 2.2));

const keyLight = new THREE.DirectionalLight(0xffffff, 3);
keyLight.position.set(-3, 5, 7);
scene.add(keyLight);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 1.8, 1.8),
  new THREE.MeshBasicMaterial({ color: 0xffffff }),
);
scene.add(cube);

const modelPivot = new THREE.Group();
scene.add(modelPivot);

const textureLoader = new THREE.TextureLoader();
textureLoader.load(
  new URL("./MrT.avif", import.meta.url).href,
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    cube.material.map = texture;
    cube.material.needsUpdate = true;
  },
  undefined,
  (error) => {
    console.error("Unable to load the Mr. T cube texture.", error);
  },
);

const modelLoader = new GLTFLoader();
modelLoader.load(
  new URL("./MrT_Edited.glb", import.meta.url).href,
  (gltf) => {
    const model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const modelHeight = 4.2;

    if (size.y <= 0) {
      console.error("The Mr. T model has no measurable height.");
      return;
    }

    const scale = modelHeight / size.y;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    modelPivot.add(model);
    modelPivot.position.x = getLayout().modelX;
  },
  undefined,
  (error) => {
    console.error("Unable to load the Mr. T 3D model.", error);
  },
);

function getLayout() {
  const halfWidth =
    camera.position.z *
    Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
    camera.aspect;

  return {
    cubeX: halfWidth * 0.58,
    modelX: halfWidth * 2.35,
    cameraPan: halfWidth * 1.8,
  };
}

function updateScene() {
  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;
  const sectionTop = scrollSection.offsetTop;
  const panStart = sectionTop - viewportHeight * 0.45;
  const panEnd = sectionTop + viewportHeight * 0.5;
  const scrollProgress = THREE.MathUtils.clamp(
    (scrollY - panStart) / (panEnd - panStart),
    0,
    1,
  );
  const easedProgress =
    scrollProgress * scrollProgress * (3 - 2 * scrollProgress);
  const layout = getLayout();

  cube.position.set(layout.cubeX - layout.cameraPan * easedProgress, 0, 0);
  modelPivot.position.x = layout.modelX;
  camera.position.x = layout.cameraPan * easedProgress;
  modelPivot.rotation.y = scrollY * 0.004;
  modelPivot.rotation.x = Math.sin(scrollY * 0.0015) * 0.08;
}

function resizeRenderer() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateScene();
}

window.addEventListener("scroll", updateScene, { passive: true });
window.addEventListener("resize", resizeRenderer);

function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x = window.scrollY * 0.001 + 0.3;
  cube.rotation.y = window.scrollY * 0.0014 + 0.4;
  renderer.render(scene, camera);
}

updateScene();
animate();
