const {ObjectMerger} = require ('subclassable-object-merger')

const CP_CAMEL  = Symbol ('camel')
const CP_UCFIST = Symbol ('unfirst')

const CH_UNDERSCORE = '_'.charCodeAt (0)

const OM = new ObjectMerger ({override: ['scalar']})

class NamingConventions {

	constructor (o) {

		this.config = OM.merge (o ?? {}, this.getDefaultOptions ())

		for (const o of Object.values (this.config.types)) {

			switch (o.case) {

				case 'snake':
					break

				case 'pascal':
					o [CP_UCFIST] = true

				case 'camel':
					o [CP_CAMEL] = true
					break

				default:
					throw Error ('Unknown case style: ' + o.case)

			}

		}

	}

	getDefaultOptions () {

		return {

			maxLength: 64,

			types: {

				module: {

					name: rq => rq.type ?? null,
	
					case: 'pascal',
				
				},
	
				method: {
	
					name: ({id, action, part}) => action ? 'do_' + action : 'get_' + (part ?? (id ? 'item' : 'list')),
	
					case: 'camel',
	
				},	

			}

		}

	}

	getName (type, rq) {

		const {types, maxLength} = this.config

		const o = types [type]; if (!o) throw Error (`Unknown type: ${type}`)

		const s = o.name (rq); if (s == null) return null

		if (typeof s !== 'string') throw Error (`Not a string generated as a ${type} name: ${s}`)

		if (s.length > maxLength) throw Error (`Too long ${type} name: ${s.slice (0, maxLength)}...`)

		return o [CP_CAMEL] ? this.toCamel (s, o [CP_UCFIST]) : s

	}

	toCamel = (s, ucFirst) =>  {

		if (typeof s !== 'string') throw new Error ('Not a string: ' + s)
	
		if (s.charCodeAt (0) === CH_UNDERSCORE) {
	
			let i = 1; while (s.charCodeAt (i) === CH_UNDERSCORE) i ++
	
			s = s.slice (i)
	
		}
	
		const {length} = s; if (length === 0) return ''
	
		let to = s.indexOf ('_'), r
	
		if (ucFirst) {
	
			const firstChar = String.fromCharCode (s.charCodeAt (0) - 32)
	
			if (to < 0) {
					
				return firstChar + s.substring (1)
			
			}
			else {
	
				r = firstChar + s.slice (1, to)
	
			}
	
		}
		else {
	
			if (to < 0) {
					
				return s
			
			}
			else {
	
				r = s.slice (0, to)
	
			}
	
		}
			
		while (true) {
	
			let from = to + 1
	
			while (from < length && s.charCodeAt (from) === CH_UNDERSCORE) from ++
	
			if (from === length) return r
	
			r += String.fromCharCode (s.charCodeAt (from) - 32)
	
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
	
}

module.exports = NamingConventions