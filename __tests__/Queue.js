const EventEmitter = require ('events')
const Path = require ('path')
const {Application, Queue} = require ('..')
const { error } = require('console')
const modules = {dir: {root: Path.join (__dirname, 'data', 'root3')}}
const app = new Application ({
	modules, 
	logger: {log: s => s}
})

test ('maxPending', async () => {

	{
		const q = new Queue (app)
		expect (q.maxPending).toBe (1)	
		expect (await q.peek ()).toBeNull ()	
	}

	{
		const maxPending = 10
		const q = new Queue (app, {maxPending})
		expect (q.maxPending).toBe (maxPending)	
	}

})

test ('onJobFinished', async () => {

	const a = [], CHECK = Symbol ('check')

	class TestQueue extends Queue {
		check () {a.push (CHECK)}
		async peek () {return {id: 1}}
	}

	const q = new TestQueue (app, {rq: {type: 'users'}})

	const j = q.createJob ()
	await j.toBroadcast ('start')
	expect (j.rq).toStrictEqual ({type: 'users', id: 1})

	expect (a).toStrictEqual ([])	
	j.emit ('finished')
	expect (a).toStrictEqual ([CHECK])

})

test ('nullRq', async () => {

	const q = new Queue (app), j = new EventEmitter ()

	await q.onJobStart (j)

	expect (j.rq).toStrictEqual ({})

})

test ('bad peek', async () => {

	class TestQueue extends Queue {
		async peek () {return 1}
	}

	const q = new TestQueue (app)

	await expect (() => q.onJobStart ({})).rejects.toBeDefined ()

})

test ('check ()', async () => {

	const u = {id: 1}, a = [u], r = []

	class TestQueue extends Queue {
		async peek () {return a [0] || null}
	}

	await new Promise ((ok, fail) => {

		const q = new TestQueue (app, {
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