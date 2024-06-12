const EventEmitter = require ('events')
const {Lag} = require ('..')

test ('bad', () => {

	expect (() => new Lag ()).toThrow ()
	expect (() => new Lag ([])).toThrow ()
	expect (() => new Lag (['0'])).toThrow ()
	expect (() => new Lag ([0, 0])).toThrow ()

})

test ('basic', () => {

	const jobSource = new EventEmitter ()
	const lag = new Lag ([0, 10, Infinity])
	lag.jobSource = jobSource

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