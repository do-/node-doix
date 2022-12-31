const EventEmitter = require ('events')

const TODO = Symbol ('todo')

class Job extends EventEmitter {

	constructor () {
		
		super ()
		
		this.rq = {}
		this [TODO] = []
	
	}
	
	waitFor (promise) {
	
		this [TODO].push (promise)
	
	}

	fail (error) {
	
		this.waitFor (new Promise (
		
			(ok, fail) => fail (error)
		
		))
	
	}
	
	async toBroadcast (event, payload) {
	
		if (this.listenerCount (event) === 0) return

		this.emit (event, this, payload)
	
		const todo = this [TODO]; switch (todo.length) {
			case 0  : return 
			case 1  : return todo.pop ()
			default : await Promise.all (todo); todo.length = 0
		}
	
	}
	
	async toComplete () {

		try {

			await this.toBroadcast ('start')

			const {app} = this, {methodSelector} = app

			const moduleName = methodSelector.getModuleName (this); 
			
			if (moduleName === null) return

			this.module = app.modules.get (moduleName)

			await this.toBroadcast ('module')

			const methodName = methodSelector.getMethodName (this)

			if (!(methodName in this.module)) throw Error ('Method "' + methodName + '" not found in "' + moduleName + '" module')

			await this.toBroadcast ('method', methodName)

			const method = this.module [methodName]

			this.result = await method.call (this)

			await this.toBroadcast ('end')

			return this.result

		}
		catch (error) {

			this.error = error

			await this.toBroadcast ('error')

			if (this.error === undefined) return undefined
			
			throw error

		}
		finally {

			await this.toBroadcast ('finish')

		}

	}

}

module.exports = Job