const EventEmitter = require ('events')

class Job extends EventEmitter {

	constructor () {
		
		super ()
		
		this.rq = {}
		this.todo = []
	
	}
	
	async echo (event, payload) {
		
		this.emit (event, payload)
	
		const {todo} = this; switch (todo.length) {
			case 0  : return 
			case 1  : return todo.pop ()
			default : await Promise.all (todo); todo.length = 0
		}
	
	}
	
	async start () {

		try {

			await this.echo ('start')

			const {app} = this, {methodSelector} = app

			const moduleName = methodSelector.getModuleName (this); if (moduleName === null) return

			this.module = app.modules.get (moduleName)

			await this.echo ('module')

			const method = this.module [methodSelector.getMethodName (this)]
			
			this.result = await method.call (this)

			await this.echo ('end')

			return this.result

		}
		catch (error) {

			this.error = error

			await this.echo ('error', error)

			throw error

		}
		finally {

			await this.echo ('finish')

		}

	}

}

module.exports = Job