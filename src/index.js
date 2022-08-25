import module from "./module.js"
import './styles/main.scss'

import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

document.body.appendChild(VRButton.createButton(renderer));

const canvas = document.querySelector('.webGL')

const sizes = {
	width: window.innerWidth,
	height: window.innerHeight
}

const scene = new THREE.Scene()

//CAMERA
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	1000
)
camera.position.z = 2

//LIGHTS
//Ambient Light
const ambientLight = new THREE.AmbientLight(0xfffffff)

//Point Light
const pointLight = new THREE.PointLight(0xffffff, 10)
pointLight.position.set(5, 8, 5)

//RENDERER
const renderer = new THREE.WebGLRenderer({
	canvas,
	alpha: false,
	antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.shadowMap.enabled = true
renderer.xr.enabled = true //VR
// document.body.appendChild(renderer.domElement)

//OBJECTS
const cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshPhysicalMaterial({
	color: 0x00ff00,
	metalness: 0.8,
	roughness: 0.8
}))

//HELPERS
//Orbit Controls
const orbitControl = new OrbitControls(camera, canvas)
// orbitControl.maxPolarAngle = 1.4
// orbitControl.minDistance = 14
// orbitControl.maxDistance = 18
orbitControl.screenSpacePanning = false


//Grid Helper
const gridHelper = new THREE.GridHelper(
	100, //size
	100, //divisions
	0xff0000 //middle lines color
)

gridHelper.position.y = -1

//LOADERS
//OBJLoader
const objLoader = new OBJLoader()

objLoader.load(
	'./assets/models/FOTOVOLTAIKA.obj',
	(object) => {
		let material = new THREE.MeshPhysicalMaterial({
			metalness: 0.9,
			roughness: 0.9,
			color: 0xffffff,
			wireframe: false,
		});
		(object.children[0]).material = material
		object.traverse(function (child) {
			if ((child).isMesh) {
				(child).material = material
			}
		})
		object = object.children[0]
		object.scale.set(.001, .001, .001)
		object.position.set(-10, -6, 0)
		// object.material.transparent = true
		scene.add(object)
	},
	(xhr) => {
		console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
	},
	(error) => {
		console.log(error)
	}
)

//SCENE OBJECTS
const sceneObjects = [
	gridHelper,
	ambientLight,
	pointLight,
	// cube, 
]

scene.add(...sceneObjects)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()
	renderer.setSize(sizes.width, sizes.height)
	render()
}

renderer.setAnimationLoop(function () {

	render()

});

// function animate() {
// 	requestAnimationFrame(animate)

// 	cube.rotation.x += 0.01
// 	cube.rotation.y += 0.01

// 	render()
// }

function render() {
	renderer.render(scene, camera)
}

// animate()