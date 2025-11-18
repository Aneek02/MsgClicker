const container = document.getElementById("container");
const messageBox = document.getElementById("message-box");

// --- Configuration ---
const PHOTO_COUNT = 5;
const FRAME_WIDTH = 2.2;
const FRAME_HEIGHT = 2.7;
const IMAGE_WIDTH = 2.0;
const IMAGE_HEIGHT = 2.0;

let scene, camera, renderer, raycaster, mouse;
const photos = [];

// Using random messages as requested.
const messages = [
  "You are my sunshine!",
  "My favorite person in the whole world!",
  "You make my heart skip a beat!",
  "My one and only!",
  "You are the cutest!",
];

// --- Initialization ---
function init() {
  // Scene, Camera, and Renderer setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  camera.position.z = 5;

  // Texture and Photo Creation
  const textureLoader = new THREE.TextureLoader();
  // Using dummy images from the web as requested.
  const textures = [
    textureLoader.load(
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=500&auto=format&fit=crop"
    ),
    textureLoader.load(
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop"
    ),
    textureLoader.load(
      "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=500&auto=format&fit=crop"
    ),
    textureLoader.load(
      "https://images.unsplash.com/photo-1530785602389-075941b8b170?w=500&auto=format&fit=crop"
    ),
    textureLoader.load(
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop"
    ),
  ];

  for (let i = 0; i < PHOTO_COUNT; i++) {
    const group = new THREE.Group();

    const frame_geometry = new THREE.PlaneGeometry(FRAME_WIDTH, FRAME_HEIGHT);
    const frame_material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const frame = new THREE.Mesh(frame_geometry, frame_material);

    const image_geometry = new THREE.PlaneGeometry(IMAGE_WIDTH, IMAGE_HEIGHT);
    const image_material = new THREE.MeshBasicMaterial({ map: textures[i] });
    const image = new THREE.Mesh(image_geometry, image_material); // Image is square
    image.position.y = 0.15; // Shift image up to create larger bottom border

    group.add(frame);
    group.add(image);

    group.position.set(0, 0, i * 0.1);
    group.userData.index = i;
    photos.push(group);
    scene.add(group);
  }

  // Raycaster and Mouse setup
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Event Listeners
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  window.addEventListener("resize", onWindowResize);

  animate();
}

let selectedPhoto = null;
let isDragging = false;

// --- Event Handlers ---
function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(photos);

  if (intersects.length > 0) {
    // The raycaster can hit the image or the frame, but we want the group.
    // The parent of the mesh is the group.
    selectedPhoto = intersects[0].object.parent;
    isDragging = true;

    // Animate the photo "popping" to the front using GSAP
    gsap.to(selectedPhoto.position, {
      z: PHOTO_COUNT * 0.1 + 1, // Bring it even further to the front
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(selectedPhoto.scale, {
      x: 1.05,
      y: 1.05,
      duration: 0.3,
      ease: "power2.out",
    });
  }
}

function onMouseMove(event) {
  if (isDragging && selectedPhoto) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));

    selectedPhoto.position.x = pos.x;
    selectedPhoto.position.y = pos.y;
  }
}

function onMouseUp(event) {
  if (isDragging && selectedPhoto) {
    const message = messages[selectedPhoto.userData.index] || "You're amazing!";
    messageBox.innerHTML = message;
    messageBox.style.display = "block";

    // Animate the photo returning to the center stack
    gsap.to(selectedPhoto.position, {
      x: 0,
      y: 0,
      z: selectedPhoto.userData.index * 0.1, // Return to its original z-depth
      duration: 0.5,
      ease: "power2.inOut",
    });
    // Animate scale back to normal
    gsap.to(selectedPhoto.scale, {
      x: 1,
      y: 1,
      duration: 0.5,
      ease: "power2.inOut",
    });

    setTimeout(() => {
      messageBox.style.display = "none";
    }, 2000);
  }
  isDragging = false;
  selectedPhoto = null; // Deselect after animation is complete
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// --- Start the application ---
init();
