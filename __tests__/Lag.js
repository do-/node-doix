const EventEmitter = require ('events')
const {Lag} = require ('..')

const jobSource = new EventEmitter ()

test ('bad', () => {

	expect (() => new Lag ()).toThrow ()
	expect (() => new Lag (jobSource)).toThrow ()
	expect (() => new Lag (jobSource, [])).toThrow ()
	expect (() => new Lag (jobSource, ['0'])).toThrow ()
	expect (() => new Lag (jobSource, [0, 0])).toThrow ()

})

test ('basic', () => {

	const lag = new Lag (jobSource, [0, 10, Infinity])
	expect (Number (lag)).toBe (0)

	jobSource.emit ('job-end')
	expect (Number (lag)).toBe (0)

	jobSource.emit ('job-error')
	expect (Number (lag)).toBe (10)

	jobSource.emit ('job-error')
	expect (Number (lag)).toBe (Infinity)

	jobSource.emit ('job-error')
	expect (Number (lag)).toBe (Infinity)

	jobSource.emit ('job-end')
	expect (Number (lag)).toBe (0)

})