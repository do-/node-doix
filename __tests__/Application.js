const Path = require ('path')
const {Application, NamingConventions, JobSource, Job} = require ('..')
const {Tracker} = require ('events-to-winston')

const modules = {dir: {root: Path.join (__dirname, 'data', 'root3')}}

class MS extends NamingConventions {getModuleName (o){return null}}

const {Writable} = require ('stream')
const winston = require ('winston')
const logger = winston.createLogger({
	transports: [
//	  new winston.transports.Console (),
	  new winston.transports.Stream ({stream: new Writable ({write(){}})})
	]
})

test ('job fail', async () => {
	
	const app = new Application ({modules, logger, globals: {[Tracker.LOGGING_EVENTS]: {start: {level: 'info'}}}})

	const svc = new JobSource (app, {name: 'svc', globals: {[Tracker.LOGGING_EVENTS]: {stop: {level: 'info'}}}})
	const job = svc.createJob ()

	expect (Object.keys (job.tracker.events).sort ()).toStrictEqual (['error', 'start', 'stop'])

	job.app = app
	job.request.type = 'users'
	job.request.id = 'AAA'
	
	job.on ('error', e => {})
	
	job.setMaxLatency (Infinity)
	await expect (() => job.outcome ()).rejects.toBeDefined ()

	job.setMaxLatency (100)
	await expect (() => job.outcome ()).rejects.toBeDefined ()
	
	job.request.action = 'delete'

	await expect (() => job.outcome ()).rejects.toBeDefined ()

})

test ('constructor', () => {

	expect (() => {new Application ()}).toThrow (TypeError)
	expect (() => {new Application ({})}).toThrow ()
	expect (() => {new Application ({modules, logger: {}})}).toThrow ()
	expect (() => {new Application ({logger})}).toThrow ()
	expect (() => {new Application ({modules, logger, foo: 1})}).toThrow ()	
	expect (() => {new Application ({modules, logger, pools: {db: {connectionString: '...'}}})}).toThrow ('ResourcePool')	
	expect (() => {new Application ({modules, logger, namingConventions: 0})}).toThrow ()	
	expect (new Application ({modules, logger, namingConventions: undefined})).toBeInstanceOf (Application)
	expect (new Application ({modules, logger, namingConventions: new MS ()})).toBeInstanceOf (Application)

	const app = new Application ({modules, logger, pools: {}})
	
	expect (app).toBeInstanceOf (Application)
	expect (app.namingConventions).toBeInstanceOf (NamingConventions)

})

test ('globals', () => {
	
	const app = new Application ({
		modules, 
		logger, 
		globals: {PI: 3.14},
		namingConventions: new NamingConventions (),
	}), svc = new JobSource (app, {name: 'svc'})

	const job = svc.createJob ()
			
	expect (job.PI).toBe (3.14)

})

test ('generators', () => {
	
	const app = new Application ({modules, logger, generators: {
		id: () => '00000000-0000-0000-0000-000000000000',
		logger: () => logger,
	}}), svc = new JobSource (app, {name: 'svc'})
	const job = svc.createJob ()

	expect (job.id).toBe ('00000000-0000-0000-0000-000000000000')
	expect (job.logger).toBe (logger)

})

test ('job 0', async () => {

	const a = []
	
	const app = new Application ({modules, logger, handlers: {

		init: _ => a.push (1),

		finish: [
			_ => a.push (2),
			_ => a.push (3),
		]

	}})
	
	const svc = new JobSource (app, {name: 'svc'})

	const job = svc.createJob ()

	const r = await job.outcome ()
	
	expect (r).toBeUndefined ()

	expect (a).toStrictEqual ([1, 2, 3])

})

test ('job ok', async () => {

	let s = ''

	const stream = new Writable ({
		write (r, _, cb) {
			s += r.toString ()
			cb ()
		}
		
	})

	const logger = winston.createLogger({
		transports: [
//		  new winston.transports.Console (),
		  new winston.transports.Stream ({stream})
		],
		format: winston.format.combine (
			winston.format.timestamp ({format: 'YYYY-MM-DD[T]hh:mm:ss.SSS'}),
			winston.format.printf ((i => `${i.timestamp} ${i.level} ${i.id} ${i.event === 'finish' ? i.elapsed + ' ms' : i.message}${i.details ? ' ' + JSON.stringify (i.details) : ''}`))
		),
	})

	const id = 28
	
	const app = new Application ({modules, logger})
	const svc = new JobSource (app, {name: 'svc', generators: {id: () => '007'}})

	const t0 = Date.now ()

	const job = svc.createJob ()

	job.request.type = 'users'
	job.request.id = id
	
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

	job.on ('init', () => {
		job.waitFor (a ())
	})

	job.on ('end', () => {
		job.waitFor (a ())
		job.waitFor (a ())
	})

	const toGetFinishd = new Promise ((ok) => {
		job.on ('next', () => ok (Date.now () - t0))
	})

	const [r, duration] = await Promise.all ([
		job.outcome (),
		toGetFinishd,
	])

	expect (r).toStrictEqual ({id})

	expect (duration).toBeGreaterThanOrEqual (100)

	const lines = s.trim ().split ('\n').map (s => s.trim ())

	expect (lines).toHaveLength (2)
	expect (lines [0]).toMatch (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3} info svc\/007 Users.getItem {"request":{"type":"users","id":28}}$/)
	expect (lines [1]).toMatch (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3} info svc\/007 \d+ ms/)

})

test ('job fail 2', async () => {

	const app = new Application ({modules, logger})
	const svc = new JobSource (app, {name: 'svc'})
	const job = svc.createJob ()

	job.on ('init', j => j.fail (Error ('OK')))

	let x

	try {
		await job.outcome ()
	}
	catch (e) {
		x = e
	}

	expect (x [Job.INSTANCE]).toBe (job)
	
})

test ('job fail 3', async () => {

	const app = new Application ({modules, logger})
	const svc = new JobSource (app, {name: 'svc'})
	const job = svc.createJob ({type: 'users', part: 'one'})

	let x

	try {
		await job.outcome ()
	}
	catch (e) {
		x = e
	}

	expect (x.message).toMatch ('"1"')
	expect (x.message).toMatch ('Users.getOne')
	expect (x [Job.INSTANCE]).toBe (job)

	expect (new Job.NotAnError ('1'.repeat (33), job.method).message).toMatch ('... (1 more)')
	
})



test ('job fail 4', async () => {

	const app = new Application ({modules, logger})
	const svc = new JobSource (app, {name: 'svc'})
	const job = svc.createJob ({type: 'users', action: 'fail'})

	let x

	try {
		await job.outcome ()
	}
	catch (e) {
		x = e
	}

	expect (x).toBeInstanceOf (Job.CustomError)
	expect (x.message).toBe ('DEBUG')
	expect (x.field).toBe ('id')
	expect (x [Job.INSTANCE]).toBe (job)
	expect (x [Job.PAYLOAD]).toStrictEqual ({field: 'id'})

	expect (new Job.CustomError ('DEBUG') [Job.PAYLOAD]).toStrictEqual ({})
	expect (new Job.CustomError ('DEBUG', null) [Job.PAYLOAD]).toBeNull

})


test ('job fail on timeout 1', async () => {

	const app = new Application ({modules, logger})
	const svc = new JobSource (app, {name: 'svc'})
	const job = svc.createJob ({type: 'users', id: 1})

	job.setMaxLatency (100)

	job.on ('init', function () {
		this.waitFor (
			new Promise (ok => {
				setTimeout (ok, 500);
			})
		)
	})

	await expect (() => job.outcome ()).rejects.toBeDefined ()
	
})

test ('job fail on timeout 2', async () => {

	const app = new Application ({modules, logger})
	const svc = new JobSource (app, {name: 'svc'})
	const job = svc.createJob ({type: 'users', action: 'wait_for', id: 500})

	job.setMaxLatency (100)

	await expect (() => job.outcome ()).rejects.toBeDefined ()
	
})

test ('job fail undefined', async () => {

	const app = new Application ({modules, logger})
	const svc = new JobSource (app, {name: 'svc'})
	const job = svc.createJob ()

	job.on ('error', function () {delete this.error})
	job.on ('init', function () {this.fail (Error ('OK'))})
		
	const r = await job.outcome ()	
	expect (r).toBeUndefined ()
	
})

test ('job src fail', async () => {

	const app = new Application ({modules, logger})

	{

		const jobSource0 = new JobSource (app, {
			name: 'jobSource0',
			lag: 10, 
			maxLatency: 10000, 
			maxPending: 1, 
			request: {type: 'users'}
		})

		expect (jobSource0.capacity).toBe (1)

		const job0 = jobSource0.createJob ({id: 1})

		expect (jobSource0.capacity).toBe (0)

		expect (job0.request).toStrictEqual ({type: 'users', id: 1})

		let ended; jobSource0.on ('job-end', payload => ended = payload)

		expect (ended).toBeUndefined ()

		await job0.outcome ();

		expect (ended === job0).toBe (true)

		expect (() => {jobSource0.createJob ()}).toThrow (JobSource.OverflowError)

	}
	
	const o = {}

	const jobSource = new JobSource (app, {
		name: 'jobSource',
		globals: {o},
		generators: {oo: () => o},
		on: {
			init: j => j.fail (Error ('OK')),
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
		'job-init',
		'job-end',
		'job-error',
		'job-finish',
		'job-next',
	]) jobSource.on (event, payload => last [event] = payload)

	expect (jobSource.capacity).toBe (Infinity)

	const job = jobSource.createJob ()

	expect (jobSource.capacity).toBe (Infinity)
		
	expect (job.o).toBe (o)
	expect (job.oo).toBe (o)
	expect (jobSource.pending.size).toBe (1)

	await expect (() => job.outcome ()).rejects.toBeDefined ()

	expect (jobSource.pending.size).toBe (0)

	expect (Object.keys (last)).toStrictEqual ([
		'job-init',
		'job-error',
		'job-finish',
		'job-next',
	])

	for (const k in last) {
		expect (last [k] === job).toBe (true)
	}

})