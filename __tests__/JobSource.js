const Path = require ('path')
const {Lag, Application, JobSource} = require ('..')

const modules = {dir: {root: Path.join (__dirname, 'data', 'root3')}}

const {Writable} = require ('stream')
const winston = require ('winston')
const logger = winston.createLogger({
	transports: [
//	  new winston.transports.Console ()
	  new winston.transports.Stream ({stream: new Writable ({write(){}})})
	]
})

test ('bad', () => {

	const app = new Application ({modules, logger})

	expect (() => new JobSource ()).toThrow ()
	expect (() => new JobSource (undefined, {})).toThrow ()
	expect (() => new JobSource ({}, {})).toThrow ()

	expect (() => new JobSource (app, {name: ''})).toThrow ('name')
	expect (() => new JobSource (app, {name: 0})).toThrow ('name')

	expect (() => new JobSource (app, {name: 's1', lag:      '1'})).toThrow ('lag')
	expect (() => new JobSource (app, {name: 's1', lag:       -1})).toThrow ('lag')
	expect (() => new JobSource (app, {name: 's1', lag:      1.5})).toThrow ('lag')
	expect (() => new JobSource (app, {name: 's1', lag: Infinity})).toThrow ('lag')
	expect (() => new JobSource (app, {name: 's1', lag:       {}})).toThrow ('lag')

	expect (() => new JobSource (app, {name: 's1', logger:    {}})).toThrow ('log')

	new JobSource (app, {lag: 1, name: 's1', logger})
	expect (() => new JobSource (app, {name: 's1'})).toThrow ('already')

	new JobSource (app, {lag: new Lag ([0, 10, Infinity]), name: 's2'})


})

test ('lag', async () => {

	const app = new Application ({modules, logger})

	const jobSource = new JobSource (app, {lag: [11, Infinity], name: 's3'})

	const job = jobSource.createJob ({type: 'userz', id: 1})

	expect (job.src).toBe (jobSource)

	const _ts = Date.now ()

	await new Promise (ok => {

		const nop = _ => _

		job.on ('next', ok)

		job.outcome ().then (nop, nop)

	}) 	

	expect (Date.now () - _ts).toBeGreaterThanOrEqual (9)

	expect (() => jobSource.createJob ({type: 'users', id: 1})).toThrow (JobSource.LockedError)

	jobSource.reset ()

	expect (await jobSource.createJob ({type: 'users', id: 1}).outcome ()).toStrictEqual ({id: 1})

})

test ('parent', async () => {

	const app = new Application ({modules, logger})

	const jobSource = new JobSource (app, {name: 's4'})

	const job1 = jobSource.createJob ({type: 'users', id: 1})
	const job2 = jobSource.createJob ({type: 'users', id: 2}, {parent: job1})

	expect (() => jobSource.createJob ({type: 'users', id: 2}, {parent: 0})).toThrow ()

	expect (job1.parent).toBeUndefined ()
	expect (job2.parent).toBe (job1)

	expect (job2.tracker.id).toMatch (job1.tracker.id)
	expect (job1.tracker.id).not.toMatch (job2.tracker.id)

})