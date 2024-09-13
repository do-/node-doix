const {NamingConventions} = require ('..')

test ('toCamel', () => {

	const m = new NamingConventions ()

	expect (() => m.toCamel ()).toThrow ()

	expect (m.toCamel ('')).toBe ('')
	expect (m.toCamel ('', true)).toBe ('')

	expect (m.toCamel ('_')).toBe ('')
	expect (m.toCamel ('_', true)).toBe ('')

	expect (m.toCamel ('___')).toBe ('')
	expect (m.toCamel ('___', true)).toBe ('')

	expect (m.toCamel ('get')).toBe ('get')
	expect (m.toCamel ('get', true)).toBe ('Get')
	
	expect (m.toCamel ('get_id')).toBe ('getId')
	expect (m.toCamel ('get_id', true)).toBe ('GetId')

	expect (m.toCamel ('get_id2')).toBe ('getId2')
	expect (m.toCamel ('get_id2', true)).toBe ('GetId2')

	expect (m.toCamel ('get_2id')).toBe ('get2id')
	expect (m.toCamel ('get_2id', true)).toBe ('Get2id')

	expect (m.toCamel ('get_____id_')).toBe ('getId')
	expect (m.toCamel ('get_____id_', true)).toBe ('GetId')

})

test ('bad', () => {

	expect (

		() => new NamingConventions ({types: {
			module: {
				case: 'ada',
				name: request => request.type,
			}
		}})
			
	).toThrow ()

	const m = new NamingConventions ()

	expect (() => m.getName ('m&m', {type: 'users'})).toThrow ()
	expect (() => m.getName ('module', {type: 0})).toThrow ()
	expect (() => m.getName ('module', {type: 'a'.repeat (65)})).toThrow ()
	expect (() => m.getName ('module', {type: '0ne'})).toThrow ('at position 0')
	expect (() => m.getName ('module', {type: 'moustashe{'})).toThrow ('at position 9')
	expect (() => m.getName ('module', {type: 'no way'})).toThrow ('at position 2')
	expect (() => m.getName ('module', {type: 'm@ail'})).toThrow ('at position 1')

})

test ('getModuleName old fashined', () => {

	const m = new NamingConventions ({types: {
		module: {
			case: 'none',
			name: request => request.type,
		}
	}})

	expect (m.getName ('module', {type: 'users'})).toBe ('users')
	expect (m.getName ('module', {type: 'applications_to_reject'})).toBe ('applications_to_reject')

})

test ('getMethodName old fashined', () => {

	const m = new NamingConventions ({types: {
		method: {
			case: 'none',
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

test ('none', () => {

	const m = new NamingConventions ({
		types: {
			method: {
				name: o => o.part,
				case: 'none',
			} 
		}	
	})

	expect (m.getName ('method', {part: 'getRequest'})).toBe ('getRequest')

})

test ('getMethodName', () => {

	const m = new NamingConventions ()

	const type = 'users'

	expect (m.getName ('method', {type})).toBe ('getList')
	expect (m.getName ('method', {type, id: 1})).toBe ('getItem')
	expect (m.getName ('method', {type, part: 'privileges', id: 1})).toBe ('getPrivileges')
	expect (m.getName ('method', {type, part: 'privileges'})).toBe ('getPrivileges')
	expect (m.getName ('method', {type, action: 'create', id: 1})).toBe ('doCreate')
	expect (m.getName ('method', {type, action: 'create_2'})).toBe ('doCreate2')

})