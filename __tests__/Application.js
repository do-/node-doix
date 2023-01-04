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

test ('globals', async () => {

	const o = {}
	
	const app = new Application ({modules, globals: {o}})
	const job = app.createJob ()
			
	expect (job.o).toBe (o)

})

test ('generators', async () => {
	
	const app = new Application ({modules, generators: {uuid: () => '00000000-0000-0000-0000-000000000000'}})
	const job = app.createJob ()

	expect (job.uuid).toBe ('00000000-0000-0000-0000-000000000000')

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
	
	job.rq.action = 'delete'

	await expect (() => job.toComplete ()).rejects.toBeDefined ()

})

test ('job fail 2', async () => {

	const app = new Application ({modules})
	const job = app.createJob ()

	job.on ('start', j => j.fail (Error ('OK')))
		
	await expect (() => job.toComplete ()).rejects.toBeDefined ()
	
})

test ('job fail undefined', async () => {

	const app = new Application ({modules})
	const job = app.createJob ()

	job.on ('error', j => delete j.error)
	job.on ('start', j => j.fail (Error ('OK')))
		
	const r = await job.toComplete ()	
	expect (r).toBeUndefined ()
	
})

test ('job src fail', async () => {

	const app = new Application ({modules})

	const jobSource0 = new JobSource (app)
	
	const o = {}

	const jobSource = new JobSource (app, {
		globals: {o},
		generators: {oo: () => o},
		on: {
			start: j => j.fail (Error ('OK')),
			error: [
				j => j,
				j => j,
			]
		},
	})

	const job = app.createJob ()
	
	expect (job.o).toBeUndefined
	expect (job.oo).toBeUndefined

	jobSource.copyHandlersTo (job)
	
	expect (job.o).toBe (o)
	expect (job.oo).toBe (o)

	await expect (() => job.toComplete ()).rejects.toBeDefined ()

})