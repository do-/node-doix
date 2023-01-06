const EventEmitter = require ('events')
const {ResourcePool} = require ('..')

class MockResource {	
	constructor (raw) {
		this.raw = raw
	}
	async release () {
		if (this.raw.isBroken) throw Error ('OK')
		this.raw.pool.cnt --
	}
	async do () {
		return 'done'
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

test ('set OK', async () => {

	const pool = new MockPool ()

	const job = new EventEmitter ()
	
	expect (pool.cnt).toBe (0)

	await pool.toSet (job, 'db')
	
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

	const job = new EventEmitter ()
	
	expect (pool.cnt).toBe (0)

	pool.setProxy (job, 'db')

	expect (pool.cnt).toBe (0)

	expect (await job.db.do ()).toBe ('done')

	job.emit ('finish')

	expect (pool.cnt).toBe (0)

})