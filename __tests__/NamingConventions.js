const {NamingConventions} = require ('..'), {snakeToCamel} = NamingConventions

test ('snakeToCamel', () => {

	expect (() => snakeToCamel ()).toThrow ()

	expect (snakeToCamel ('')).toBe ('')
	expect (snakeToCamel ('', true)).toBe ('')

	expect (snakeToCamel ('_')).toBe ('')
	expect (snakeToCamel ('_', true)).toBe ('')

	expect (snakeToCamel ('___')).toBe ('')
	expect (snakeToCamel ('___', true)).toBe ('')

	expect (snakeToCamel ('get')).toBe ('get')
	expect (snakeToCamel ('get', true)).toBe ('Get')
	
	expect (snakeToCamel ('get_id')).toBe ('getId')
	expect (snakeToCamel ('get_id', true)).toBe ('GetId')

	expect (snakeToCamel ('get_____id_')).toBe ('getId')
	expect (snakeToCamel ('get_____id_', true)).toBe ('GetId')

})

test ('getMethodName', () => {

	const m = new NamingConventions ()
	const type = 'users'

	expect (m.getName ('method', {type})).toBe ('select_users')
	expect (m.getName ('method', {type, id: 1})).toBe ('get_item_of_users')
	expect (m.getName ('method', {type, part: 'vocs', id: 1})).toBe ('get_vocs_of_users')
	expect (m.getName ('method', {type, part: 'vocs'})).toBe ('get_vocs_of_users')
	expect (m.getName ('method', {type, action: 'create', id: 1})).toBe ('do_create_users')
	expect (m.getName ('method', {type, action: 'create'})).toBe ('do_create_users')

})