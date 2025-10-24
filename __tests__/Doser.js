const EventEmitter = require ('events')
const {Tracker} = require ('events-to-winston')
const {Doser} = require ('..')

const winston = require ('winston')
const {Writable} = require ('stream')
const logger = winston.createLogger({
	transports: [
//	  new winston.transports.Console (),
	  new winston.transports.Stream ({stream: new Writable ({write(){}})})
	]
})

class App extends EventEmitter {

	constructor () {
		super ()
		this.logger = logger
		this [Tracker.LOGGING_ID] = 'a'
	}	

}

const app = new App ()

test ('bad', () => {

	expect (() => new Doser (app, {maxSize: ''})).toThrow ('nvalid')
	expect (() => new Doser (app, {maxSize: -1})).toThrow ('ositive')
	expect (() => new Doser (app, {maxSize: 3.14})).toThrow ('nvalid')
	expect (() => new Doser (app, {interval: ''})).toThrow ('nvalid')
	expect (() => new Doser (app, {interval: -1})).toThrow ('nvalid')

})

test ('basic', () => {

	const doser = new Doser (app)

	const r = []; doser.on ('data', _ => r.push (_))

	doser.push (1)
	doser.push (2)
	doser.push (3)

	expect (r).toStrictEqual ([])

	doser.flush ()

	expect (r).toStrictEqual ([[1, 2, 3]])

	doser.stop ()

	expect (r).toStrictEqual ([[1, 2, 3]])

	expect (() => doser.push (0)).toThrow ()

})

test ('maxSize', () => {

	const doser = new Doser (app, {maxSize: 2})

	const r = []; doser.on ('data', _ => r.push (_))

	doser.push (1)
	doser.push (2)

	expect (r).toStrictEqual ([[1, 2]])

	doser.push (3)
	doser.stop ()

	expect (r).toStrictEqual ([[1, 2], [3]])

})

test ('interval', async () => {

	const doser = new Doser (app, {interval: 50})

	const r = []; doser.on ('data', _ => r.push (_))
	let f = 0; doser.on ('finish', _ => f ++)

	doser.push (1)
	doser.push (2)
	doser.push (3)

	expect (r).toStrictEqual ([])

	await new Promise (ok => setTimeout (ok, 100))

	expect (r).toStrictEqual ([[1, 2, 3]])
	expect (f).toBe (0)

	app.emit ('finish')
	expect (f).toBe (1)

	doser.stop ()
	expect (f).toBe (1)

})

test ('basic', () => {

	const doser = new Doser (app, {name: 'd'})
	let f = 0; doser.on ('error', _ => f ++)

	class Q {
		#a = []
		add (o) {
			if (o.data [0] < 0) throw Error ('Negative')
			this.#a.push (o)
		}
		get a () {return this.#a}
	}

	const q = doser.pipe (new Q ())

	doser.push (1)
	doser.push (2)

	doser.flush ()

	expect (q.a).toStrictEqual ([{data: [1, 2]}])

	expect (f).toBe (0)

	doser.push (-1)
	doser.stop ()

	expect (f).toBe (1)


})
