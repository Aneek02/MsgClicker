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
    console.error("Container element not found! Ensure index.html has <div id='container'></div>");
    return;
  }
  
  // Scene, Camera, and Renderer setup
  scene = new THREE.Scene();
  // Using background color from CSS in the scene
  scene.background = new THREE.Color(0xfce4ec); 
  
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({ antialias: true }); // Added antialiasing for better look
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

let selectedPhoto = null;
let isDragging = false;

// --- Event Handlers ---
function onMouseDown(event) {
  // Don't interact if the message box is currently visible
  if (messageBox.style.display === 'block') return; 

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  
  // Find intersections with the photo groups' children (frame and image)
  const intersects = raycaster.intersectObjects(photos.flatMap(p => p.children), false); 

  if (intersects.length > 0) {
    // The closest intersected object's parent is the THREE.Group (the photo)
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

    // Convert mouse coordinates to 3D world coordinates on a plane in front of the camera
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5); // 0.5 is a depth value, adjust as needed
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    
    // Calculate distance to the initial z-position of the photo (or a close plane)
    // Using a fixed distance for dragging in 2D space for simplicity
    const distance = (camera.position.z + selectedPhoto.position.z) / dir.z; 
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));

    selectedPhoto.position.x = pos.x;
    selectedPhoto.position.y = pos.y;
  }
}

function onMouseUp(event) {
  if (isDragging && selectedPhoto) {
    const index = selectedPhoto.userData.index;
    const message = messages[index] || "You're amazing!";
    
    // --- Message Box Display ---
    // The previous implementation used innerHTML on messageBox, but had a reference to message-text. 
    // Since message-text is removed, we set the message directly on the box and show it.
    messageBox.innerHTML = `<p>${message}</p>`; // Wrap in <p> to apply CSS styling
    messageBox.style.display = "block";
    
    // Animate the photo returning to the center stack
    gsap.to(selectedPhoto.position, {
      x: 0,
      y: 0,
      z: index * 0.1, // Return to its original z-depth
      duration: 0.5,
      ease: "power2.inOut",
    });
    // Animate scale back to normal
    gsap.to(selectedPhoto.scale, {
      x: 1,
      y: 1,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        // Ensure the selectedPhoto reference is cleared only after the animation
        selectedPhoto = null; 
      }
    });

    // Hide the message box after 2 seconds
    setTimeout(() => {
      messageBox.style.display = "none";
    }, 2000);
  }
  isDragging = false;
  // If we had a quick click without a drag, selectedPhoto would be cleared here.
  // We moved the clearance into the GSAP onComplete to prevent drag issues.
  if (!isDragging && selectedPhoto) {
    // If it was just a click, ensure it snaps back and scale returns
    gsap.to(selectedPhoto.scale, {x: 1, y: 1, duration: 0.1});
    gsap.to(selectedPhoto.position, {z: selectedPhoto.userData.index * 0.1, duration: 0.1, onComplete: () => {
        selectedPhoto = null;
    }});
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  
  // Gently rotate the photos on the z-axis for a subtle 3D effect
  photos.forEach((photo, index) => {
    // Prevent dragging photo from rotating
    if (photo !== selectedPhoto) {
      photo.rotation.z = Math.sin(Date.now() * 0.0005 + index) * 0.1;
      photo.rotation.x = Math.sin(Date.now() * 0.0003 + index) * 0.05;
    }
  });

  renderer.render(scene, camera);
}

// --- Start the application ---
init();