const {Writable} = require ('stream')
const winston = require ('winston')
const logger = winston.createLogger({
	transports: [
//	  new winston.transports.Console ()
	  new winston.transports.Stream ({stream: new Writable ({write(){}})})
	]
})

const EventEmitter = require ('events')
const {Router, JobSource, Application} = require ('..')

const Path = require ('path')
const modules = {dir: {root: Path.join (__dirname, 'data', 'root3')}}

const app = new Application ({modules, logger})

class Marker extends JobSource {

	constructor (id, label) {
		super (app)
		this.id = id
		this.label = label
	}

	test (m) {
		return m.id == this.id
	}

	process (m) {
		m.label = this.label
	}

}

test ('Router 1', () => {

	const r = new Router ()
	
	const p = new Marker (1, 'one')
	
	r.add (p)

	expect (p.router).toBe (r)
	
	let m = {id: 1}
	
	r.process (m)	
	
	expect (m).toStrictEqual ({id: 1, label: 'one'})

})

test ('Router 12', () => {

	const r = new Router ()
	
	r
		.add (new Marker (1, 'one'))
		.add (new Marker (2, 'two'))
	
	let m = {id: 1}	
	r.process (m)
	
	expect (m).toStrictEqual ({id: 1, label: 'one'})

	m = {id: 2}	
	r.process (m)
	
	expect (m).toStrictEqual ({id: 2, label: 'two'})

})

test ('Router A', () => {

	const r = new Router ()
	
	r.add ({process: m => m.label = '???'})
	
	let m = {id: 1}
	
	r.process (m)	
	
	expect (m).toStrictEqual ({id: 1, label: '???'})

})

class BotchedProcessor extends EventEmitter {

	constructor () {
		super ()
	}

	process () {
		this.emit ('error', new Error ('OK'))
	}

}

test ('Router error', () => {

	const r = new Router ()
	
	const p = new BotchedProcessor ()
	
	r.add (p)
	
	expect (p.listenerCount ('error')).toBe (0)
	
	r.listen ()
	
	expect (p.listenerCount ('error')).toBe (1)
	
	let msg
	
	r.on ('error', e => msg = e.message)
	
	r.process ({id: 1})

	expect (msg).toBe ('OK')

	r.add (p)
	r.add ({})
	r.listen ()

})

class BrokenProcessor extends EventEmitter {

	constructor () {
		super ()
	}

	process () {
		throw Error ('OK')
	}

}

test ('Router error 2', () => {

	const r = new Router ()

	let msg

	const p = new BrokenProcessor ()

	r.add (p)
	r.add ({})

	r.on ('error', e => msg = e.message)

	r.process ({id: 1})	

	expect (msg).toBe ('OK')

})