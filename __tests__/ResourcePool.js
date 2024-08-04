const EventEmitter = require ('events')
const Path = require ('path')
const {ResourcePool, Application} = require ('..')

const {Writable} = require ('stream')
const winston = require ('winston')
const logger = winston.createLogger({
	transports: [
//	  new winston.transports.Console ()
	  new winston.transports.Stream ({stream: new Writable ({write(){}})})
	]
})

const modules = {dir: {root: Path.join (__dirname, 'data', 'root3')}}

class MockParentResource {	
	async get () {
		return 'value'
	}
}

class MockResource extends MockParentResource {	
	constructor (raw) {
		super ()
		this.raw = raw
	}
	async release () {
		if (this.raw.isBroken) throw Error ('OK')
		this.raw.pool.cnt --
	}
	async do (x) {
		return x || 'done'
	}
}

class MockResourceRoman extends MockResource {	
	constructor (raw) {
		super (raw)
		this.ten = 'X'
	}
}

class MockPool extends ResourcePool {
	constructor () {
		super ()
		this.wrapper = MockResource
		this.cnt = 0
	}
	async acquire () {
		this.cnt ++
		return {pool: this}
	}
}	

test ('job logger', async () => {

	const pool = new MockPool ()

	const job = new EventEmitter ()
	
	const logger = {}
	
	job.logger = logger
	
	await pool.toSet (job, 'db')
	
	expect (job.db.logger).toBe (logger)
	expect (job.db.name).toBe ('db')

})

test ('pool logger', async () => {

	const logger = {}

	class MockResource2 extends MockResource {	
		constructor (raw) {
			super (raw)
			this.logger = logger
		}
	}

	class MockPool2 extends MockPool {	
		constructor () {
			super ()
			this.wrapper = MockResource2
		}
	}

	const pool = new MockPool2 ()

	const job = new EventEmitter ()
		
	await pool.toSet (job, 'db')
	
	expect (job.db.logger).toBe (logger)

})

test ('set OK', async () => {

	const pool = new MockPool ()
	
	pool.ten = 10
	pool.shared.add ('ten')
	pool.wrapper = MockResourceRoman

	const job = new EventEmitter ()
	
	expect (pool.cnt).toBe (0)

	await pool.toSet (job, 'db')

	expect (job.db.ten).toBe ('X')
	
	expect (pool.cnt).toBe (1)
	
	job.emit ('finish')

	expect (pool.cnt).toBe (0)

})

test ('set Error', async () => {

	const pool = new MockPool ()
	
	let caught
	
	const onError = function (x) {caught = x}	

	pool.on ('error', onError)

	const job = new EventEmitter ()
	
	expect (pool.cnt).toBe (0)

	await pool.toSet (job, 'db')
	
	expect (pool.cnt).toBe (1)
	
	job.db.raw.isBroken = true
	
	job.emit ('finish')

	await new Promise ((ok, fail) => {
	
		setTimeout (() => {expect (caught.message).toBe ('OK'); ok ()}, 100)		
	
	})

})

test ('proxy', async () => {

	const pool = new MockPool ()

	pool.on ('acquire', resource => resource.waitFor (
		new Promise ((ok, fail) => ok (resource.f = true))
	))

	pool.ten = 10
	pool.shared.add ('ten')

	const job = new EventEmitter ()
	
	expect (pool.cnt).toBe (0)

	pool.setProxy (job, 'db')

	expect (pool.cnt).toBe (0)

	expect (job.db.job).toBe (job)

	expect (await job.db.get ()).toBe ('value')

	expect (await job.db.f).toBe (true)

	expect (pool.cnt).toBe (1)

	expect (job.db.ten).toBe (10)

	expect (job.db.job).toBe (job)

	expect (await job.db.do ()).toBe ('done')
	
	expect (job.db.ten).toBe (10)

	job.emit ('finish')

	expect (pool.cnt).toBe (0)

})

test ('app pools', async () => {
	
	const pool = new MockPool ()

	const app = new Application ({modules, logger, pools: {db: pool}})

	const job = app.createJob ()	

	const {db} = job

	expect ([...job.resources (MockPool)]).toStrictEqual ([db])
	expect ([...job.resources (ResourcePool)]).toStrictEqual ([db])
	expect ([...job.resources (String)]).toStrictEqual ([])

	expect (pool.app).toBe (app)
	expect (pool.name).toBe ('db')

	expect (await db.do (1)).toBe (1)
	expect (pool.cnt).toBe (1)

	expect (await db.do ()).toBe ('done')
	expect (pool.cnt).toBe (1)

	job.emit ('finish')

	expect (pool.cnt).toBe (0)

})