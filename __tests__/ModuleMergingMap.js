const {ModuleMergingMap, ObjectMerger} = require ('..')

class MyObjectMerger extends ObjectMerger {
	merge () {
		// do nothing
	}
}

const mu1 = () => ({
	type: 'users',
	get_item: () => ({id: 1})
})

const mu2 = () => ({
	select: () => [1, 2].map (id => ({id}))
})

const mr = () => ({
	select: () => ([{name: 'operator'}])
})

test ('constructor', () => {

	expect (
		new ModuleMergingMap ()
	).toBeInstanceOf (ModuleMergingMap)

	expect (() => {
		new ModuleMergingMap (1)
	}).toThrow ()

	expect (() => {
		new ModuleMergingMap ({
			id: 1
		})
	}).toThrow ()

	expect (() => {
		new ModuleMergingMap ({
			merger: null
		})
	}).toThrow ()

	expect (
		new ModuleMergingMap ({
			merger: new ObjectMerger ()
		})
	).toBeInstanceOf (ModuleMergingMap)

	expect (
		new ModuleMergingMap ({
			merger: new MyObjectMerger ()
		})
	).toBeInstanceOf (ModuleMergingMap)

	expect (() => {
		new ModuleMergingMap ({
			merger: new ModuleMergingMap ()
		})
	}).toThrow ()

})

test ('set', () => {

	const m = new ModuleMergingMap ()

	expect (() => {
		m.set (1, mu1 ())
	}).toThrow ()

	expect (() => {
		m.set ('users', 1)
	}).toThrow ()

	expect (() => {
		m.set ('users', null)
	}).toThrow ()

	expect (() => {
		m.set ('users', [mu1 (), mu2 ()])
	}).toThrow ()

	m.set ('users', mu1 ())
	m.set ('users', mu2 ())

	m.set ('roles', mr ())

	expect (m.size).toBe (2)
	
	const users = m.get ('users')
	const roles = m.get ('roles')

	expect (users.type).toBe ('users')

	expect (users.get_item ()).toStrictEqual ({id: 1})

	expect (users).toHaveProperty ('select')

	expect (users.select ()).toStrictEqual ([users.get_item (), {id: 2}])

	expect (roles.select ()).toStrictEqual ([{name: 'operator'}])

})


test ('custom merge', () => {

	const m = new ModuleMergingMap ({
		merger: new MyObjectMerger ()
	})

	m.set ('users', mu1 ())
	m.set ('users', mu2 ())

	m.set ('roles', mr ())

	expect (m.size).toBe (2)
	
	const users = m.get ('users')
	const roles = m.get ('roles')

	expect (users.type).toBe ('users')

	expect (users.get_item ()).toStrictEqual ({id: 1})
	
	expect (users).not.toHaveProperty ('select')

	expect (roles.select ()).toStrictEqual ([{name: 'operator'}])

})