const Path = require ('path')
const {DirPaths} = require ('..')

const r = () => ['root1', 'root2'].map (i => Path.join (__dirname, 'data', i))

test ('dir', () => {

	expect (() => {DirPaths ()}).toThrow ()

	expect (() => {DirPaths ({
		root: r (), 
		filter: Infinity
	})}).toThrow ()
	
	expect ([...DirPaths ({
		root: r ()[1], 
	})]).toHaveLength (10)

	expect ([...DirPaths ({
		root: r (), 
		filter: (s, a) => a.at (-2) === 'dw'
	})]).toHaveLength (4)

	expect ([...DirPaths ({
		root: r ()[1], 
		filter: (s, a) => a.at (-2) === 'dw'
	})]).toHaveLength (1)

})
