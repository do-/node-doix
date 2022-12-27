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

			const moduleName = methodSelector.getModuleName (this); if (moduleName === null) return

			this.module = app.modules.get (moduleName)

			await this.toBroadcast ('module')

			const method = this.module [methodSelector.getMethodName (this)]
			
			await this.toBroadcast ('method', method)

			this.result = await method.call (this)

			await this.toBroadcast ('end')

			return this.result

		}
		catch (error) {

			this.error = error

			await this.toBroadcast ('error')

			throw error

		}
		finally {

			await this.toBroadcast ('finish')

		}

	}

}

module.exports = Job