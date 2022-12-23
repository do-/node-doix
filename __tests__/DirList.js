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

test ('constructor', () => {

	expect (() => [...(new DirList (
	))]).toThrow ()

	expect (() => [...(new DirList ({
		root: NaN,
	}))]).toThrow ()

	expect (() => [...(new DirList ({
		root: r (), 
		filter: Infinity
	}))]).toThrow ()

	expect (() => [...(new DirList ({
		root: r (), 
		filter: Infinity
	}))]).toThrow ()	
	
	expect ([...(new DirList ({
		root: r ()[1], 
	}))]).toHaveLength (10)
	
	expect ([...(new DirList ({
		root: r (), 
		filter: (s, a) => a.at (-2) === 'dw'
	}))]).toHaveLength (4)

	expect ([...(new DirList ({
		root: r ()[1], 
		filter: (s, a) => a.at (-2) === 'dw'
	}))]).toHaveLength (1)

})

test ('live', () => {
	
	const dir = new DirList ({
		root: r (),
	})

	x_off ()

	expect ([...dir]).toHaveLength (N)

	x_on ()

	expect ([...dir]).toHaveLength (N + 1)

	x_off ()

	expect ([...dir]).toHaveLength (N)

})

test ('!live', () => {

	const dir = new DirList ({
		root: r (),
		live: false,
	})

	x_off ()

	expect ([...dir]).toHaveLength (N)

	x_on ()

	expect ([...dir]).toHaveLength (N)

	x_off ()

	expect ([...dir]).toHaveLength (N)

})