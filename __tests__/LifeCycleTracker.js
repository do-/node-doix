const EventEmitter = require ('events')
const {LifeCycleTracker} = require ('..')

test ('message', () => {

	const messages = []

	const logger = {log: o => messages.push (o)}

	class MyLifeCycleTracker extends LifeCycleTracker {

		getPrefix (payload) {

			return payload || super.getPrefix ()

		}

		oneMessage () {
			return {message: '1', level: 'debug'}
		}

		twoMessage () {
			return {message: '2'}
		}

		threeMessage () {
			return '3'
		}

	} 

	const ee = new EventEmitter ()

	const el  = new MyLifeCycleTracker (ee, logger)

	ee.emit ('one')
	ee.emit ('two')
	ee.emit ('three')

	expect (messages).toStrictEqual (
		[
			{message: '1', level: 'debug'},
			{message: '2', level: 'info'},
			{message: '3', level: 'info'}
		]
	)
	
})