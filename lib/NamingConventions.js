class NamingConventions {

	constructor (o = {}) {

		this.for = {}

		this.for.module = o.module ?? (rq => rq.type ?? null)

		this.for.method = o.method ?? (({type, id, action, part}) => {

			if (action) return 'do_' + action + '_' + type

			if (!part && id) part = 'item'
	
			return (part ? 'get_' + part + '_of': 'select') + '_' + type
	
		})

	}

	getName (what, rq) {

		return this.for [what] (rq)

	}

	getModuleName (rq) {

		return this.getName ('module', rq)

	}

	getMethodName (rq) {

		return this.getName ('method', rq)

	}

}

module.exports = NamingConventions