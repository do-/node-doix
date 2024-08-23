const {NamingConventions} = require ('..')

test ('getModuleName', () => {

	const m = new NamingConventions ()
		
	expect (() => m.getModuleName ()).toThrow (TypeError)

	expect (m.getModuleName ({})).toBe (null)

	for (const type of [null, undefined])
		expect (m.getModuleName ({type})).toBe (null)

	for (const type of ['users'])
		expect (m.getModuleName ({type})).toBe (type)

})

test ('getMethodName', () => {

	const m = new NamingConventions ()
	const type = 'users'

	expect (m.getMethodName ({type})).toBe ('select_users')
	expect (m.getMethodName ({type, id: 1})).toBe ('get_item_of_users')
	expect (m.getMethodName ({type, part: 'vocs', id: 1})).toBe ('get_vocs_of_users')
	expect (m.getMethodName ({type, part: 'vocs'})).toBe ('get_vocs_of_users')
	expect (m.getMethodName ({type, action: 'create', id: 1})).toBe ('do_create_users')
	expect (m.getMethodName ({type, action: 'create'})).toBe ('do_create_users')

})