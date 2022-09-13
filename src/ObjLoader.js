import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'


function ObjLoader(url, scene, manager) {

	const objLoader = new OBJLoader(manager)

	objLoader.load(
		url,
		(object) => {

			let material = new THREE.MeshPhysicalMaterial({
				metalness: 0.9,
				roughness: 0.9,
				color: 0xffffff,
				wireframe: false,
			});

			// (object.children[0]).material = material

			// object.traverse(function (child) {
			// 	if ((child).isMesh) {
			// 		(child).material = material
			// 	}
			// })

			// object = object.children[0]

			object.scale.set(.001, .001, .001)
			object.position.set(-11, 0, 10)
			object.rotateX(-Math.PI / 2)
			scene.add(object)
		},
		(xhr) => {
			console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
		},
		(error) => {
			console.log(error)
		}
	)
}

export default ObjLoader
