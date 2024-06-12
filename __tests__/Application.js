const Path = require ('path')
const {Application, MethodSelector, JobLifeCycleTracker, JobSource} = require ('..')
const { isGeneratorFunction } = require('util/types')

const modules = {dir: {root: Path.join (__dirname, 'data', 'root3')}}

class MS extends MethodSelector {getModuleName (o){return null}}

test ('constructor', () => {

	expect (() => {new Application ()}).toThrow (TypeError)
	expect (() => {new Application ({})}).toThrow ()
	expect (() => {new Application ({modules, foo: 1})}).toThrow ()	
	expect (() => {new Application ({modules, methodSelector: 0})}).toThrow ()	
	expect (new Application ({modules, methodSelector: undefined})).toBeInstanceOf (Application)
	expect (new Application ({modules, methodSelector: new MS ()})).toBeInstanceOf (Application)

	const app = new Application ({modules})
	
	expect (app).toBeInstanceOf (Application)
	expect (app.methodSelector).toBeInstanceOf (MethodSelector)

})

test ('globals', async () => {

	const o = {}
	
	const app = new Application ({modules, globals: {eventLogger: null, logger: o}})
	const job = app.createJob ()
			
	expect (job.logger).toBe (o)

})

test ('generators', async () => {
	
	const app = new Application ({modules, generators: {
		uuid: () => '00000000-0000-0000-0000-000000000000',
	}})
	const job = app.createJob ()

	expect (job.uuid).toBe ('00000000-0000-0000-0000-000000000000')

})

test ('trackerClass', async () => {

	class EL {constructor (job){this.job = job}}
	
	const app = new Application ({modules, trackerClass: EL})

	const job = app.createJob (), {tracker} = job

	expect (job.tracker).toBe (tracker)

	expect (tracker).toBeInstanceOf (EL)

})

test ('logger', async () => {

	const logger = {}
	
	const app = new Application ({modules, logger})
	const job = app.createJob ()

	expect (job.logger).toBe (logger)
	expect (job.tracker).toBeInstanceOf (JobLifeCycleTracker)

})

test ('clone', async () => {
	
	const app = new Application ({modules, logger: {log: s => s}})
	
	const rq = {type: 'users', action: 'create', data: {label: 'admin'}}

	const job = app.createJob ()
	job.rq = rq

	{			
		const j1 = job.clone ()
		expect (j1.parent).toBe (job)
		expect (j1.rq).toStrictEqual (rq)
	}

	{
		const j2 = job.clone ({id: 1, action: undefined, data: undefined})
		expect (j2.parent).toBe (job)
		expect (j2.rq).toStrictEqual ({type: 'users', id: 1, action: undefined, data: undefined})
	}

})

test ('job 0', async () => {

	const a = []
	
	const app = new Application ({modules, handlers: {

		start: _ => a.push (1),

		finish: [
			_ => a.push (2),
			_ => a.push (3),
		]

	}})
	
	const job = app.createJob ()

	const r = await job.clone ().toComplete ()
	
	expect (r).toBeUndefined ()

	expect (a).toStrictEqual ([1, 2, 3])

})

test ('job ok', async () => {

	const id = 28
	
	const app = new Application ({modules, logger: {log: s => s}})

	const t0 = Date.now ()

	const job = app.createJob ()
	
	job.rq.type = 'users'
	job.rq.id = id
	
	const a = async () => {}

	expect (() => job.setMaxLatency ('10')).toThrow ()
	expect (() => job.setMaxLatency (-1)).toThrow ()
	expect (() => job.setMaxLatency (3.14)).toThrow ()

	expect (() => job.setMinLatency ('10')).toThrow ()
	expect (() => job.setMinLatency (-1)).toThrow ()
	expect (() => job.setMinLatency (3.14)).toThrow ()
	expect (() => job.setMinLatency (Infinity)).toThrow ()
	
	job.setMinLatency (100)
	job.setMaxLatency (10000)

	job.on ('start', () => {
		job.waitFor (a ())
	})

	job.on ('end', () => {
		job.waitFor (a ())
		job.waitFor (a ())
	})

	const toGetFinishd = new Promise ((ok) => {
		job.on ('finished', () => ok (Date.now () - t0))
	})

	const [r, duration] = await Promise.all ([
		job.toComplete (),
		toGetFinishd,
	])

	expect (r).toStrictEqual ({id})

	expect (duration).toBeGreaterThanOrEqual (100)

})

test ('job fail', async () => {

	const id = 28
	
	const app = new Application ({modules, logger: {log: s => s}})
	const job = app.createJob ()
	
	job.app = app
	job.rq.type = 'users'
	job.rq.id = 'AAA'
	
	job.on ('error', e => {})
	
	job.setMaxLatency (Infinity)
	await expect (() => job.toComplete ()).rejects.toBeDefined ()

	job.setMaxLatency (100)
	await expect (() => job.toComplete ()).rejects.toBeDefined ()
	
	job.rq.action = 'delete'

	await expect (() => job.toComplete ()).rejects.toBeDefined ()

})

test ('job fail 2', async () => {

	const app = new Application ({modules, logger: {log: s => s}})
	const job = app.createJob ()

	job.on ('start', j => j.fail (Error ('OK')))
		
	await expect (() => job.toComplete ()).rejects.toBeDefined ()
	
})

test ('job fail on timeout 1', async () => {

	const app = new Application ({modules, logger: {log: s => s}})
	const job = app.createJob ({type: 'users', id: 1})

	job.setMaxLatency (100)

	job.on ('start', function () {
		this.waitFor (
			new Promise (ok => {
				setTimeout (ok, 500);
			})
		)
	})

	await expect (() => job.toComplete ()).rejects.toBeDefined ()
	
})

test ('job fail on timeout 2', async () => {

	const app = new Application ({modules, logger: {log: s => s}})
	const job = app.createJob ({type: 'users', action: 'wait_for', id: 500})

	job.setMaxLatency (100)

	await expect (() => job.toComplete ()).rejects.toBeDefined ()
	
})

test ('job fail undefined', async () => {

	const app = new Application ({modules, logger: {log: s => s}})
	const job = app.createJob ()

	job.on ('error', function () {delete this.error})
	job.on ('start', function () {this.fail (Error ('OK'))})
		
	const r = await job.toComplete ()	
	expect (r).toBeUndefined ()
	
})

test ('job src fail', async () => {

	const app = new Application ({modules, logger: {log: s => s}})

	{

		const jobSource0 = new JobSource (app, {
			lag: 10, 
			maxLatency: 10000, 
			maxPending: 1, 
			rq: {type: 'users'}
		})

		expect (jobSource0.capacity).toBe (1)

		const job0 = jobSource0.createJob ({id: 1})

		expect (jobSource0.capacity).toBe (0)

		expect (job0.rq).toStrictEqual ({type: 'users', id: 1})

		let ended; jobSource0.on ('job-end', payload => ended = payload)

		expect (ended).toBeUndefined ()

		await job0.toComplete ();

		expect (ended === job0).toBe (true)

		expect (() => {jobSource0.createJob ()}).toThrow (JobSource.OverflowError)

	}
	
	const o = {}

	const jobSource = new JobSource (app, {
		globals: {o},
		generators: {oo: () => o},
		on: {
			start: j => j.fail (Error ('OK')),
			method: [
				j => j,
				j => j,
			],
			error: [
				j => j,
				j => j,
			]
		},
	})

	const last = {}

	for (const event of [
		'job-start',
		'job-end',
		'job-error',
		'job-finish',
		'job-finished',
	]) jobSource.on (event, payload => last [event] = payload)

	expect (jobSource.capacity).toBe (Infinity)

	const job = jobSource.createJob ()

	expect (jobSource.capacity).toBe (Infinity)
		
	expect (job.o).toBe (o)
	expect (job.oo).toBe (o)
	expect (jobSource.pending.size).toBe (1)

	await expect (() => job.toComplete ()).rejects.toBeDefined ()

	expect (jobSource.pending.size).toBe (0)

	expect (Object.keys (last)).toStrictEqual ([
		'job-start',
		'job-error',
		'job-finish',
		'job-finished',
	])

	for (const k in last) {
		expect (last [k] === job).toBe (true)
	}

})