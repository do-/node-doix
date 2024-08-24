const {ObjectMerger} = require ('subclassable-object-merger')

const CH_UNDERSCORE = '_'.charCodeAt (0)

const OM = new ObjectMerger ({override: ['scalar']})

const snakeToCamel = (s, ucFirst) =>  {

	if (typeof s !== 'string') throw new Error ('Not a string: ' + s)

	if (s.charCodeAt (0) === CH_UNDERSCORE) {

		let i = 1; while (s.charCodeAt (i) === CH_UNDERSCORE) i ++

		s = s.slice (i)

	}

	const {length} = s; if (length === 0) return ''

	let to = s.indexOf ('_'); if (to < 0) return ucFirst ? s.charAt (0).toUpperCase () + s.substring (1) : s

	let r = ucFirst ? s.charAt (0).toUpperCase () + s.slice (1, to) : s.slice (0, to)
	
	while (true) {

		let from = to + 1

		while (from < length && s.charCodeAt (from) === CH_UNDERSCORE) from ++

		if (from === length) return r

		r += s.charAt (from).toUpperCase ()

		to = s.indexOf ('_', from)

		from ++

		if (to < 0) {

			return r + s.slice (from)

		}
		else {

			r += s.slice (from, to)

		}

	}

}

class NamingConventions {

	static snakeToCamel = snakeToCamel

	constructor (o) {

		this.for = OM.merge (o ?? {}, {

			module: rq => rq.type ?? null,

			method: ({type, id, action, part}) => {

				if (action) return 'do_' + action + '_' + type
	
				if (!part && id) part = 'item'
		
				return (part ? 'get_' + part + '_of': 'select') + '_' + type
		
			}

		})

	}

	getName (what, rq) {

		return this.for [what] (rq)

	}

}

module.exports = NamingConventions