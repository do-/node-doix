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

test ('bad', () => {

	expect (

		() => new NamingConventions ({types: {
			module: {
				case: 'ada',
				name: rq => rq.type,
			}
		}})
			
	).toThrow ()

	const m = new NamingConventions ()

	expect (() => m.getName ('m&m', {type: 'users'})).toThrow ()

})

test ('getModuleName old fashined', () => {

	const m = new NamingConventions ({types: {
		module: {
			case: 'snake',
			name: rq => rq.type,
		}
	}})

	expect (m.getName ('module', {type: 'users'})).toBe ('users')
	expect (m.getName ('module', {type: 'applications_to_reject'})).toBe ('applications_to_reject')

})

test ('getMethodName old fashined', () => {

	const m = new NamingConventions ({types: {
		method: {
			case: 'snake',
			name: ({type, id, action, part}) => {

				if (action) return 'do_' + action + '_' + type
	
				if (!part && id) part = 'item'
		
				return (part ? 'get_' + part + '_of': 'select') + '_' + type
		
			},
		}
	}})

	const type = 'users'

	expect (m.getName ('method', {type})).toBe ('select_users')
	expect (m.getName ('method', {type, id: 1})).toBe ('get_item_of_users')
	expect (m.getName ('method', {type, part: 'privileges', id: 1})).toBe ('get_privileges_of_users')
	expect (m.getName ('method', {type, part: 'privileges'})).toBe ('get_privileges_of_users')
	expect (m.getName ('method', {type, action: 'create', id: 1})).toBe ('do_create_users')
	expect (m.getName ('method', {type, action: 'create'})).toBe ('do_create_users')

})

test ('getModuleName', () => {

	const m = new NamingConventions ()

	expect (m.getName ('module', {type: 'users'})).toBe ('Users')
	expect (m.getName ('module', {type: 'applications_to_reject'})).toBe ('ApplicationsToReject')

})

test ('getMethodName', () => {

	const m = new NamingConventions ()

	const type = 'users'

	expect (m.getName ('method', {type})).toBe ('getList')
	expect (m.getName ('method', {type, id: 1})).toBe ('getItem')
	expect (m.getName ('method', {type, part: 'privileges', id: 1})).toBe ('getPrivileges')
	expect (m.getName ('method', {type, part: 'privileges'})).toBe ('getPrivileges')
	expect (m.getName ('method', {type, action: 'create', id: 1})).toBe ('doCreate')
	expect (m.getName ('method', {type, action: 'create'})).toBe ('doCreate')

})