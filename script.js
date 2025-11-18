// Global scope variables are fine, but ensure they are correctly referenced
const container = document.getElementById("container");
const messageBox = document.getElementById("message-box");
// messageText is not needed anymore as we set innerHTML on messageBox

// --- Configuration ---
const PHOTO_COUNT = 5;
const FRAME_WIDTH = 2.2;
const FRAME_HEIGHT = 2.7;
const IMAGE_WIDTH = 2.0;
const IMAGE_HEIGHT = 2.0;

// --- State Management ---
let selectedPhoto = null;
let isDragging = false;
let dragStartPosition = { x: 0, y: 0 };
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
  // Check if container exists before trying to append to it
  if (!container) {
    console.error(
      "Container element not found! Ensure index.html has <div id='container'></div>"
    );
    return;
  }

  // Scene, Camera, and Renderer setup
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // Make renderer transparent by setting alpha: true
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

  // Basic frame material
  const frame_material = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (let i = 0; i < PHOTO_COUNT; i++) {
    const group = new THREE.Group();

    // Frame (white border)
    const frame_geometry = new THREE.PlaneGeometry(FRAME_WIDTH, FRAME_HEIGHT);
    const frame = new THREE.Mesh(frame_geometry, frame_material);

    // Image
    const image_geometry = new THREE.PlaneGeometry(IMAGE_WIDTH, IMAGE_HEIGHT);
    const image_material = new THREE.MeshBasicMaterial({ map: textures[i] });
    const image = new THREE.Mesh(image_geometry, image_material);
    image.position.y = 0.15; // Shift image up to create larger bottom border (polaroid effect)

    group.add(frame);
    group.add(image);

    // Spread photos in a stack
    group.position.set(0, 0, i * 0.1);
    group.userData.index = i;
    photos.push(group);
    scene.add(group);
  }

  // Raycaster and Mouse setup
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Event Listeners
  // Listeners are added to the canvas element or window as needed
  document.addEventListener("mousedown", onMouseDown, false);
  document.addEventListener("mousemove", onMouseMove, false);
  document.addEventListener("mouseup", onMouseUp, false);
  window.addEventListener("resize", onWindowResize, false);

  animate();
}

// --- Event Handlers ---
function onMouseDown(event) {
  // Don't interact if the message box is currently visible
  if (messageBox.style.display === "block") return;

  // Store initial drag position to differentiate click vs. drag
  dragStartPosition.x = event.clientX;
  dragStartPosition.y = event.clientY;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Find intersections with the photo groups' children (frame and image)
  const intersects = raycaster.intersectObjects(
    photos.flatMap((p) => p.children),
    false
  );

  if (intersects.length > 0) {
    // The closest intersected object's parent is the THREE.Group (the photo)
    selectedPhoto = intersects[0].object.parent;
    isDragging = true;

    // Animate the photo "popping" to the front using GSAP
    gsap.to(selectedPhoto.position, {
      // This animation still works for picking up
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
  // If we are dragging, check if the mouse has moved enough to be considered a drag
  if (isDragging) {
    const dx = event.clientX - dragStartPosition.x;
    const dy = event.clientY - dragStartPosition.y;
    if (Math.sqrt(dx * dx + dy * dy) < 5) return; // Not a drag yet
  }

  if (isDragging && selectedPhoto) {
    // Update mouse vector
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the new mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate the position on a plane at z=0
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);

    // Set the photo's position to the intersection point
    selectedPhoto.position.set(
      intersectPoint.x,
      intersectPoint.y,
      selectedPhoto.position.z
    );
  }
}

function onMouseUp(event) {
  if (!selectedPhoto) return;

  // Check if it was a click or a drag
  const dx = event.clientX - dragStartPosition.x;
  const dy = event.clientY - dragStartPosition.y;
  const isClick = Math.sqrt(dx * dx + dy * dy) < 5;

  // The topmost photo is the last one in the array (highest z-index)
  const topmostPhoto = photos[photos.length - 1];

  if (isClick && selectedPhoto === topmostPhoto) {
    // --- CLICK LOGIC ---
    // It was a click on the topmost photo, show a message
    const message = messages[selectedPhoto.userData.index] || "You're amazing!";
    messageBox.innerHTML = `<p>${message}</p>`;
    messageBox.style.display = "block";

    // Hide the message after a delay
    setTimeout(() => {
      messageBox.style.display = "none";
    }, 2000);

    // Animate the photo back to its original state
    gsap.to(selectedPhoto.scale, { x: 1, y: 1, duration: 0.3 });
    gsap.to(selectedPhoto.position, {
      z: selectedPhoto.userData.index * 0.1,
      duration: 0.3,
    });
  } else {
    // --- DRAG LOGIC ---
    // It was a drag, so just leave the photo where it was dropped.
    // We can animate the scale back to normal for a nice "drop" effect.
    gsap.to(selectedPhoto.scale, { x: 1, y: 1, duration: 0.3 });
  }

  isDragging = false;
  selectedPhoto = null;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  // The animation loop is now only responsible for rendering the scene.
  // All animations are handled by GSAP on user interaction.
  renderer.render(scene, camera);
}

// --- Start the application ---
init();
