import './styles/main.scss'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { AmmoPhysics } from 'three/examples/jsm/physics/AmmoPhysics.js';

import ObjLoader from './ObjLoader';

const manager = new THREE.LoadingManager();

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

//OBJECTS

const sphere = new THREE.Mesh(
	new THREE.SphereGeometry(1, 32, 16),
	new THREE.MeshPhysicalMaterial({ color: 0xffff00 })
)

sphere.position.y = 5

const floor = new THREE.Mesh(
	new THREE.BoxGeometry(30, 0.2, 30),
	new THREE.MeshPhysicalMaterial({ color: 0xffff00 })
)

floor.position.y = -0.2
floor.receiveShadow = true

// //LOADERS
// //OBJLoader
ObjLoader('./assets/models/FOTOVOLTAIKA.obj', group, manager)

async function init() {

	let spheres

	const material = new THREE.MeshLambertMaterial();

	const matrix = new THREE.Matrix4();
	const color = new THREE.Color();

	//PHYSCICS
	// let physics = await AmmoPhysics()
	// const position = new THREE.Vector3()

	// physics.addMesh(floor)
	// // physics.addMesh(sphere)

	// const geometrySphere = new THREE.IcosahedronGeometry(0.075, 3);
	// spheres = new THREE.InstancedMesh(sphere, material, 100);
	// spheres.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
	// spheres.castShadow = true;
	// spheres.receiveShadow = true;
	// scene.add(spheres);

	// for (let i = 0; i < spheres.count; i++) {

	// 	matrix.setPosition(Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5);
	// 	spheres.setMatrixAt(i, matrix);
	// 	spheres.setColorAt(i, color.setHex(0xffffff * Math.random()));

	// }

	// physics.addMesh(spheres, 1);

	manager.onLoad = function () {

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

			if (group.children[0]) {
				return raycaster.intersectObjects(group.children[0].children, true)
			}

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

		//GAMEPAD

		window.addEventListener("gamepadconnected", (e) => {
			console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
				e.gamepad.index, e.gamepad.id,
				e.gamepad.buttons.length, e.gamepad.axes.length)
		})

		window.addEventListener("gamepaddisconnected", (e) => {
			console.log("Gamepad disconnected from index %d: %s",
				e.gamepad.index, e.gamepad.id)
		});

		const gamepads = {}

		function gamepadHandler(event, connecting) {
			const gamepad = event.gamepad

			// gamepad === navigator.getGamepads()[gamepad.index]

			if (connecting) {
				gamepads[gamepad.index] = gamepad
			} else {
				delete gamepads[gamepad.index]
			}
		}

		window.addEventListener("gamepadconnected", (e) => { gamepadHandler(e, true); }, false)
		window.addEventListener("gamepaddisconnected", (e) => { gamepadHandler(e, false); }, false)

		//SCENE OBJECTS
		const sceneObjects = [
			gridHelper,
			// ambientLight,
			// pointLight,
			// cube,
			floor,
			sphere,
			hemisphereLight,
			directionalLight,
			controller1,
			controllerGrip2
		]

		scene.add(...sceneObjects)

		// setInterval(() => {

		// 	let index = Math.floor(Math.random() * 10);

		// 	position.set(0, Math.random() + 1, 0);
		// 	physics.setMeshPosition(sphere, position, index);

		// }, 1000 / 60);

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

	}
}
init();
