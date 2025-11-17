const container = document.getElementById('container');
const messageBox = document.getElementById('message-box');

let scene, camera, renderer;
let photos = [];
let raycaster, mouse;

const messages = [
    "You are my sunshine!",
    "My favorite person in the whole world!",
    "You make my heart skip a beat!",
    "My one and only!",
    "You are the cutest!"
];

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    camera.position.z = 5;

    const textureLoader = new THREE.TextureLoader();
    const photo_1 = textureLoader.load('https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aHVtYW58ZW58MHx8MHx8fDA%3D');
    const photo_2 = textureLoader.load('https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aHVtYW58ZW58MHx8MHx8fDA%3D');
    const photo_3 = textureLoader.load('https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aHVtYW58ZW58MHx8MHx8fDA%3D');
    const photo_4 = textureLoader.load('https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aHVtYW58ZW58MHx8MHx8fDA%3D');
    const photo_5 = textureLoader.load('https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aHVtYW58ZW58MHx8MHx8fDA%3D');

    const textures = [photo_1,photo_2,photo_3,photo_4,photo_5];

    for (let i = 0; i < 5; i++) {
        const group = new THREE.Group();

        const frame_geometry = new THREE.PlaneGeometry(2.2, 2.7);
        const frame_material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const frame = new THREE.Mesh(frame_geometry, frame_material);

        const image_geometry = new THREE.PlaneGeometry(2, 2);
        const image_material = new THREE.MeshBasicMaterial({ map: textures[i] });
        const image = new THREE.Mesh(image_geometry, image_material);
        image.position.y = 0.15;

        group.add(frame);
        group.add(image);

        group.position.set(0, 0, i * 0.1);
        group.userData.index = i;
        photos.push(group);
        scene.add(group);
    }

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', onWindowResize);

    animate();
}

let selectedPhoto = null;
let isDragging = false;

function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(photos);

    if (intersects.length > 0) {
        selectedPhoto = intersects[0].object;
        isDragging = true;
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
        const message = messages[selectedPhoto.userData.index];
        messageBox.innerHTML = message;
        messageBox.style.display = 'block';

        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 2000);
    }
    isDragging = false;
    selectedPhoto = null;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function generateQRCode() {
    const typeNumber = 4;
    const errorCorrectionLevel = 'L';
    const qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData('https://your-url-here.netlify.app');
    qr.make();
    document.getElementById('qrcode').innerHTML = qr.createImgTag();
}

init();
generateQRCode();
