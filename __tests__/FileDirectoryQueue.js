const Path = require ('path')
const {Job, Application, FileDirectoryQueue} = require ('..')
const modules = {dir: {root: Path.join (__dirname, 'data', 'root3')}}

const winston = require ('winston')
const logger = winston.createLogger({
	transports: [
	  new winston.transports.Console ()
	],
	silent: true,
})

const app = new Application ({
	modules, 
	logger
})

test ('basic', async () => {

	const q = new FileDirectoryQueue (app, {name: 'q1', dirname: Path.join (__dirname, 'data', 'root1', 'back', 'lib', 'Model', 'dw', '2_entities')})

	const o = await q.peek ()

	expect (o).toEqual ({id: 'tb_houses.js'})

})

test ('test 0', async () => {

	class Q extends FileDirectoryQueue {

		constructor (app) {
			super (app, {name: 'q2', dirname: Path.join (__dirname, 'data', 'root1', 'back', 'lib', 'Model', 'dw', '2_entities')})
		}

		test () {
			return false
		}

	}

	const q = new Q (app)

	const o = await q.peek ()

	expect (o).toBeNull ()

})

test ('test 1', async () => {

	class Q extends FileDirectoryQueue {

		constructor (app) {
			super (app, {name: 'q3', dirname: Path.join (__dirname)})
		}

		test (name) {
			return name.toLowerCase ().includes ('ryqu')
		}

	}

	const q = new Q (app)

	const o = await q.peek ()

	expect (o).toEqual ({id: 'FileDirectoryQueue.js'})

})

test ('test E', async () => {

	class Q extends FileDirectoryQueue {

		constructor (app) {
			super (app, {name: 'q4', dirname: Path.join (__dirname, 'data', 'root1', 'back', 'lib', 'Model', 'dw', '2_entities')})
		}

		test () {
			throw Error ('DEBUG')
		}

	}

	const q = new Q (app)

	const o = await q.peek ()

	expect (o).toBeNull ()

})
