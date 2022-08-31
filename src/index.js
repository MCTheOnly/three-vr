import './styles/main.scss'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

import ObjLoader from './ObjLoader';


const intersected = [];
const tempMatrix = new THREE.Matrix4();

const canvas = document.querySelector('.webGL')

const sizes = {
	width: window.innerWidth,
	height: window.innerHeight
}

//SCENE
const scene = new THREE.Scene();

const group = new THREE.Group();
scene.add(group);

// //CAMERA
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	1000
)
camera.position.set(15, 5, 0)

// //LIGHTS
// //Ambient Light
const ambientLight = new THREE.AmbientLight(0xfffffff)

//Point Light
const pointLight = new THREE.PointLight(0xffffff, 10)
pointLight.position.set(5, 8, 5)

//Hemisphere Light
const hemisphereLight = new THREE.HemisphereLight(0x808080, 0x606060);

const directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(0, 6, 0);
directionalLight.castShadow = true;
directionalLight.shadow.camera.top = 2;
directionalLight.shadow.camera.bottom = - 2;
directionalLight.shadow.camera.right = 2;
directionalLight.shadow.camera.left = - 2;
directionalLight.shadow.mapSize.set(4096, 4096);

//RENDERER
const renderer = new THREE.WebGLRenderer({
	canvas,
	alpha: false,
	antialias: true
})

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.xr.enabled = true;

document.body.appendChild(VRButton.createButton(renderer));

//HELPERS
//Orbit Controls
const orbitControls = new OrbitControls(camera, renderer.domElement);
// orbitControls.target.set(0, 1.6, 0);
orbitControls.update();

//Grid Helper
const gridHelper = new THREE.GridHelper(
	100, //size
	100, //divisions
	0xff0000 //middle lines color
)

// //LOADERS
// //OBJLoader
ObjLoader('./assets/models/FOTOVOLTAIKA.obj', group)

// CONTROLLERS
const controllerModelFactory = new XRControllerModelFactory();

//Controller Right
const controller1 = renderer.xr.getController(0);
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
scene.add(controller1);

const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
scene.add(controllerGrip1);

//Controller Left
const controller2 = renderer.xr.getController(1);
controller2.addEventListener('selectstart', onSelectStart);
controller2.addEventListener('selectend', onSelectEnd);
scene.add(controller2);

const controllerGrip2 = renderer.xr.getControllerGrip(1);
controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
scene.add(controllerGrip2);

//Controllers Line
const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1)]);

const line = new THREE.Line(geometry);
line.name = 'line';
line.scale.z = 5;

controller1.add(line.clone());
controller2.add(line.clone());

//RAYCASTER
const raycaster = new THREE.Raycaster();

window.addEventListener('resize', onWindowResize);

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(sizes.width, sizes.height);

}

function onSelectStart(event) {

	const controller = event.target

	const intersections = getIntersections(controller)

	if (intersections.length > 0) {

		const intersection = intersections[0]

		const object = intersection.object
		object.material.emissive.b = 1
		controller.attach(object)

		controller.userData.selected = object
	}
}

function onSelectEnd(event) {

	const controller = event.target

	if (controller.userData.selected !== undefined) {

		const object = controller.userData.selected
		object.material.emissive.b = 0
		group.attach(object)

		controller.userData.selected = undefined
	}
}

function getIntersections(controller) {

	tempMatrix.identity().extractRotation(controller.matrixWorld)

	raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld)
	raycaster.ray.direction.set(0, 0, - 1).applyMatrix4(tempMatrix)

	return raycaster.intersectObjects(group.children[0].children, false)

}

function intersectObjects(controller) {

	if (controller.userData.selected !== undefined) return

	const line = controller.getObjectByName('line')
	const intersections = getIntersections(controller)

	if (intersections.length > 0) {

		const intersection = intersections[0]

		const object = intersection.object
		object.material.emissive.r = 1
		intersected.push(object)

		line.scale.z = intersection.distance

	} else {

		line.scale.z = 5
	}
}

function cleanIntersected() {

	while (intersected.length) {

		const object = intersected.pop()
		object.material.emissive.r = 0
	}
}

//SCENE OBJECTS
const sceneObjects = [
	gridHelper,
	// ambientLight,
	// pointLight,
	// cube,
	hemisphereLight,
	directionalLight,
	controller1,
	controllerGrip2
]

scene.add(...sceneObjects)

function render() {

	cleanIntersected();

	intersectObjects(controller1);
	// intersectObjects(controller2);

	renderer.render(scene, camera);

}

renderer.setAnimationLoop(function () {
	onWindowResize()
	cleanIntersected();
	intersectObjects(controller1);
	render()

});

// animate();

