const Path = require ('path')
const {Application, MethodSelector, Job, JobSource} = require ('..')

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

test ('job 0', async () => {
	
	const app = new Application ({modules})
	const job = app.createJob ()
		
	const r = await job.toComplete ()
	
	expect (r).toBeUndefined ()

})

test ('job ok', async () => {

	const id = 28
	
	const app = new Application ({modules})
	const job = app.createJob ()
	
	job.rq.type = 'users'
	job.rq.id = id
	
	const a = async () => {}
	
	job.on ('start', () => {
		job.waitFor (a ())
	})

	job.on ('end', () => {
		job.waitFor (a ())
		job.waitFor (a ())
	})

	const r = await job.toComplete ()

	expect (r).toStrictEqual ({id})

})

test ('job fail', async () => {

	const id = 28
	
	const app = new Application ({modules})
	const job = app.createJob ()
	
	job.app = app
	job.rq.type = 'users'
	job.rq.id = 'AAA'
	
	job.on ('error', e => {})
	
	await expect (() => job.toComplete ()).rejects.toBeDefined ()
	
})

test ('job fail 2', async () => {

	const app = new Application ({modules})
	const job = app.createJob ()

	job.on ('start', j => j.fail (Error ('OK')))
		
	await expect (() => job.toComplete ()).rejects.toBeDefined ()
	
})

test ('job src fail', async () => {

	const app = new Application ({modules})

	const jobSource0 = new JobSource (app)

	const jobSource = new JobSource (app, {
		on: {
			start: j => j.fail (Error ('OK')),
			error: [
				j => j,
				j => j,
			]
		},
	})

	const job = app.createJob ()
	
	jobSource.copyHandlersTo (job)

	await expect (() => job.toComplete ()).rejects.toBeDefined ()

})