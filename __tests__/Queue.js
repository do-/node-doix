const EventEmitter = require ('events')
const process = require('node:process')
const Path = require ('path')
const {Job, Application, Queue} = require ('..')
const modules = {dir: {root: Path.join (__dirname, 'data', 'root3')}}

const {Writable} = require ('stream')
const winston = require ('winston')
const logger = winston.createLogger({
	transports: [
//	  new winston.transports.Console ()
	  new winston.transports.Stream ({stream: new Writable ({write(){}})})
	]
})

const app = new Application ({
	modules, 
	logger
})

test ('maxPending', async () => {

	{
		const q = new Queue (app, {name: 'q1'})
		expect (q.maxPending).toBe (1)	
		expect (await q.peek ()).toBeNull ()	
	}

	{
		const maxPending = 10
		const q = new Queue (app, {name: 'q2', maxPending})
		expect (q.maxPending).toBe (maxPending)	
	}

})

test ('onJobFinished', async () => {

	const a = [], CHECK = Symbol ('check')

	class TestQueue extends Queue {
		check () {a.push (CHECK)}
		async peek (job) {
			if (!(job instanceof Job)) throw Error ('Not a Job')
			return {id: 1}
		}
	}

	const q = new TestQueue (app, {name: 'q3', rq: {type: 'users'}})

	const j = q.createJob ()
	await j.toBroadcast ('start')
	expect (j.rq).toStrictEqual ({type: 'users', id: 1})

	expect (a).toStrictEqual ([])	
	j.emit ('finished')
	expect (a).toStrictEqual ([CHECK])

})

test ('nullRq', async () => {

	const q = new Queue (app, {name: 'q4'}), j = new EventEmitter ()

	await q.onJobStart (j)

	expect (j.rq).toStrictEqual ({})

})

test ('bad peek', async () => {

	class TestQueue extends Queue {
		async peek () {return 1}
	}

	const q = new TestQueue (app, {name: 'q5'})

	await expect (() => q.onJobStart ({})).rejects.toBeDefined ()

})

test ('check ()', async () => {

	const u = {id: 1}, a = [u], r = []

	class TestQueue extends Queue {
		async peek () {return a [0] || null}
	}

	await new Promise ((ok, fail) => {

		const q = new TestQueue (app, {
			name: 'q6',
			rq: {type: 'users'},
			on: {
				end:    function () {r.push (this.result)},
				error:  function () {fail (this.error)},
				finish: function () {a.shift ()},
			}
		})

		q.on ('job-finished', () => {
			if (q.pending.size === 0) ok ()
		})
	
		q.lag = Infinity
	
		expect (() => q.check ()).toThrow ()
	
		q.lag = 0

		try {
			q.check ()	
			q.check ()	
		}
		catch (x) {
			fail (x)
		}

	})

	expect (a).toHaveLength (0)
	expect (r).toStrictEqual ([u])

})

test ('cron', async () => {

	process.on('exit', (code) => {
		console.log('Process beforeExit event with code: ', code);
	  });

	const u = {id: 1}, a = [u], r = []

	class TestQueue extends Queue {
		async peek () {return a [0] || null}
	}

	await new Promise ((ok, fail) => {

		const q = new TestQueue (app, {
			name: 'q7',
			rq: {type: 'users'},
			cron: '* * * * * *',
			on: {
				end:    function () {r.push (this.result)},
				error:  function () {fail (this.error)},
				finish: function () {a.shift ()},
			}
		})

		q.on ('job-finished', () => {
			if (q.pending.size === 0) ok ()
		})

	})

	app.emit ('finish')

	expect (a).toHaveLength (0)
	expect (r).toStrictEqual ([u])

})