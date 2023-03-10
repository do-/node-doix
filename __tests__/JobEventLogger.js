const EventEmitter = require ('events')
const {JobEventLogger} = require ('..')

class MockJob extends EventEmitter {

	constructor () {
	
		super ()
	
		this.messages = []
		
		this.logger = {}
		
		this.uuid = '00000000-0000-0000-0000-000000000000'
		
		this.rq = {type: 'users'}
		
		this.logger.log = m => this.messages.push (m)
	
	}

}

test ('test no prefix', () => {

	const job = new MockJob ()
	
	delete job.uuid
	
	const el = new JobEventLogger (job)
	
	job.emit ('start', job)
	
	expect (job.messages).toStrictEqual ([{level: 'info', message: '>'}])

})

test ('test nested', () => {

	const job = new MockJob ()
	
	job.parent = {uuid: '00000000-0000-0000-0000-000000000000'}
	
	const el = new JobEventLogger (job)
	
	job.emit ('start', job)
	
	expect (job.messages).toStrictEqual ([{level: 'info', message: '00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000 >'}])

})

test ('test start', () => {

	const job = new MockJob ()
	
	const el = new JobEventLogger (job)
	
	job.emit ('start', job)
	
	expect (job.messages).toStrictEqual ([{level: 'info', message: '00000000-0000-0000-0000-000000000000 >'}])

})

test ('test method', () => {

	const job = new MockJob ()
	
	const el = new JobEventLogger (job)
	
	job.emit ('method', job, 'get_users')
	
	expect (job.messages).toStrictEqual ([{level: 'info', message: '00000000-0000-0000-0000-000000000000 get_users {"type":"users"}'}])

})

test ('test error string', () => {

	const job = new MockJob ()
	
	job.error = '1'
	
	const el = new JobEventLogger (job)
	
	job.emit ('error', job, job.error)
	
	expect (job.messages).toStrictEqual ([{level: 'error', message: '00000000-0000-0000-0000-000000000000 1'}])

})

test ('test error object', () => {

	const job = new MockJob ()
	
	job.error = new Error ('OK')
	
	const el = new JobEventLogger (job)
	
	job.emit ('error', job, job.error)
	
	expect (job.messages).toHaveLength (1)
	expect (job.messages [0].level).toBe ('error')

})

test ('test finish', () => {

	const job = new MockJob ()
		
	const el = new JobEventLogger (job)
	
	job.emit ('finish', job)
	
	expect (job.messages).toHaveLength (1)
	expect (job.messages [0].level).toBe ('info')

})