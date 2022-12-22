const Path = require ('path')
const {DirPaths, FilePaths} = require ('..')

const p = Path.join (__dirname, 'data', 'root1', 'back', 'lib', 'Model', 'dw', '2_entities')

test ('files', () => {
	
	expect (() => {FilePaths ().next ()}).toThrow ()
	
	expect (() => {FilePaths ({dir: -1}).next ()}).toThrow ()

	expect ([...FilePaths ({
			dir: DirPaths ({
				root: ['root1', 'root2'].map (i => Path.join (__dirname, 'data', i)),
				filter: (s, a) => a.at (-2) === 'dw'
			})
		}) 
	]).toHaveLength (4)

	expect ([...FilePaths ({
			dir: DirPaths ({
				root: ['root1', 'root2'].map (i => Path.join (__dirname, 'data', i)),
				filter: (s, a) => a.at (-2) === 'dw'
			}),
			filter: 'tb_houses.js',
			
		}) 
	]).toHaveLength (4)

	expect ([...FilePaths ({
			dir: DirPaths ({
				root: ['root1', 'root2'].map (i => Path.join (__dirname, 'data', i)),
				filter: (s, a) => a.at (-2) === 'dw'
			}),
			filter: 'vw_houses.js',
			
		}) 
	]).toHaveLength (0)

	expect ([...FilePaths ({
			dir: DirPaths ({
				root: Path.join (__dirname, 'data', 'root2'),
				filter: (s, a) => a.at (-2) === 'dw'
			})
		}) 
	]).toHaveLength (1)

	expect ([...FilePaths ({
			dir: DirPaths ({
				root: Path.join (__dirname, 'data', 'root2'),
			}),
			filter: () => false
		}) 
	]).toHaveLength (0)

	expect ([...FilePaths ({
			dir: Path.join (__dirname, 'data', 'root2'),
			filter: () => false
		}) 
	]).toHaveLength (0)

})
