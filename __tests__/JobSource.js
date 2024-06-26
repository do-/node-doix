const EventEmitter = require ('events')
const Path = require ('path')
const {Lag, Application, MethodSelector, JobLifeCycleTracker, JobSource} = require ('..')
const { type } = require('os')

const modules = {dir: {root: Path.join (__dirname, 'data', 'root3')}}

test ('bad', () => {

	const app = new Application ({modules})

	expect (() => new JobSource (app, {lag:      '1'})).toThrow ()
	expect (() => new JobSource (app, {lag:       -1})).toThrow ()
	expect (() => new JobSource (app, {lag:      1.5})).toThrow ()
	expect (() => new JobSource (app, {lag: Infinity})).toThrow ()
	expect (() => new JobSource (app, {lag:       {}})).toThrow ()

	new JobSource (app, {lag: 1})
	new JobSource (app, {lag: new Lag ([0, 10, Infinity])})

})

test ('lag', async () => {

	const app = new Application ({modules, logger: {log: s => s}})

	const jobSource = new JobSource (app, {lag: [10, Infinity]})

	const job = jobSource.createJob ({type: 'userz', id: 1})

	const _ts = Date.now ()

	await new Promise (ok => {

		const nop = _ => _

		job.on ('finished', ok)

		job.toComplete ().then (nop, nop)

	}) 	

	expect (Date.now () - _ts).toBeGreaterThanOrEqual (10)

	expect (() => jobSource.createJob ({type: 'users', id: 1})).toThrow (JobSource.LockedError)

	jobSource.reset ()

	expect (await jobSource.createJob ({type: 'users', id: 1}).toComplete ()).toStrictEqual ({id: 1})

})