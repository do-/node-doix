const fs = require ('fs')
const Path = require ('path')
const {DirList} = require ('..')

const r = () => ['root1', 'root2'].map (i => Path.join (__dirname, 'data', i))

const N = 35

const x = Path.join (__dirname, 'data', 'root1', 'x')

function x_off () {
	if (fs.existsSync (x)) fs.rmdirSync (x)
}

function x_on () {
	if (!fs.existsSync (x)) fs.mkdirSync (x)
}


test ('bad', () => {

	const dir = new DirList ()

	expect (() => dir.paths).toThrow ()

})

test ('live', () => {
	
	const dir = new DirList ({
		root: r (),
	})

	x_off ()

	expect ([...dir.paths]).toHaveLength (N)

	x_on ()

	expect ([...dir.paths]).toHaveLength (N + 1)

	x_off ()

	expect ([...dir.paths]).toHaveLength (N)

})

test ('!live', () => {

	const dir = new DirList ({
		root: r (),
		live: false,
	})

	x_off ()

	expect ([...dir.paths]).toHaveLength (N)

	x_on ()

	expect ([...dir.paths]).toHaveLength (N)

	x_off ()

	expect ([...dir.paths]).toHaveLength (N)

})