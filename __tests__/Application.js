const Path = require ('path')
const {Application, MethodSelector, Job} = require ('..')

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
	const job = new Job ()
	
	job.app = app
	
	const r = await job.start ()
	
	expect (r).toBeUndefined ()

})

test ('job ok', async () => {

	const id = 28
	
	const app = new Application ({modules})
	const job = new Job ()
	
	job.app = app
	job.rq.type = 'users'
	job.rq.id = id
	
	const a = async () => {}
	
	job.on ('start', () => {
		job.todo.push (a ())
	})

	job.on ('end', () => {
		job.todo.push (a ())
		job.todo.push (a ())
	})
	
	const r = await job.start ()

	expect (r).toStrictEqual ({id})

})

test ('job fail', async () => {

	const id = 28
	
	const app = new Application ({modules})
	const job = new Job ()
	
	job.app = app
	job.rq.type = 'users'
	job.rq.id = 'AAA'
	
	job.on ('error', e => {})
	
	await expect (() => job.start ()).rejects.toBeDefined ()
	
})
