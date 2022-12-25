const {MethodSelector} = require ('..')

test ('getModuleName', () => {

	const m = new MethodSelector ()
		
	expect (() => m.getModuleName ()).toThrow (TypeError)
	expect (() => m.getModuleName (0)).toThrow (TypeError)
	expect (() => m.getModuleName ({rq: 0})).toThrow (TypeError)
	expect (() => m.getModuleName ({rq: {type: NaN}})).toThrow (TypeError)

	expect (m.getModuleName ({})).toBe (null)
	expect (m.getModuleName ({rq: {}})).toBe (null)

	for (const type of [null, undefined])
		expect (m.getModuleName ({rq: {type}})).toBe (null)

	for (const type of ['users'])
		expect (m.getModuleName ({rq: {type}})).toBe (type)

})

test ('getMethodName', () => {

	const m = new MethodSelector ()
	const type = 'users'

	expect (m.getMethodName ({rq: {type}})).toBe ('select_users')
	expect (m.getMethodName ({rq: {type, id: 1}})).toBe ('get_item_of_users')
	expect (m.getMethodName ({rq: {type, part: 'vocs', id: 1}})).toBe ('get_vocs_of_users')
	expect (m.getMethodName ({rq: {type, part: 'vocs'}})).toBe ('get_vocs_of_users')
	expect (m.getMethodName ({rq: {type, action: 'create', id: 1}})).toBe ('do_create_users')
	expect (m.getMethodName ({rq: {type, action: 'create'}})).toBe ('do_create_users')

})