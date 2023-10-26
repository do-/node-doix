const TZ_OFFSET_MIN   = (new Date ()).getTimezoneOffset ()

const TZ_OFFSET_MS    = TZ_OFFSET_MIN * 60000

const TZ_OFFSET_HH_MM = Number (- TZ_OFFSET_MIN).toLocaleString ('en', {signDisplay: 'always'}).charAt (0)

	+ (new Date (2000, 1, 1, 0, -2 * TZ_OFFSET_MIN, 0)).toJSON ().slice (11, 16)

class ConsoleLogger {

	log ({message, level}) {

		const dt = new Date (Date.now () - TZ_OFFSET_MS).toISOString ().slice (0, 23)
	
		console.log (`${dt}${TZ_OFFSET_HH_MM} ${level} ${message}`.trim ())

	}

}

ConsoleLogger.DEFAULT = new ConsoleLogger ()

module.exports = ConsoleLogger