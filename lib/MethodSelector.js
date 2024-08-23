class MethodSelector {

	getModuleName (rq) {

		return rq.type || null

	}

	getMethodName ({type, id, action, part}) {

		if (action) return 'do_' + action + '_' + type

		if (!part && id) part = 'item'

		return (part ? 'get_' + part + '_of': 'select') + '_' + type

	}

}

module.exports = MethodSelector