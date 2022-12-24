const {ModuleMap, ObjectMerger} = require ('..')
const Path = require ('path')

const r = () => ['root1', 'root2'].map (i => Path.join (__dirname, 'data', i))

const dir = {
	root: r (),
	filter: (s, a) => a.at (-2) === 'oltp'
}

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

	expect (() => {
		new ModuleMap ()
	}).toThrow ()

	expect (() => {
		new ModuleMap ({})
	}).toThrow ()

	expect (() => {
		new ModuleMap (1)
	}).toThrow ()

	expect (() => {
		new ModuleMap ({
			id: 1
		})
	}).toThrow ()

	expect (() => {
		new ModuleMap ({
			merger: null
		})
	}).toThrow ()

	expect (
		new ModuleMap ({
			dir,
			merger: new ObjectMerger ()
		})
	).toBeInstanceOf (ModuleMap)

	expect (
		new ModuleMap ({
			dir,
			merger: new MyObjectMerger ()
		})
	).toBeInstanceOf (ModuleMap)

	expect (() => {
		new ModuleMap ({
			dir,
			merger: new ModuleMap ()
		})
	}).toThrow ()

	expect (() => {
		new ModuleMap ({
			dir,
			ext: 0,
		})
	}).toThrow ()

})

test ('set', () => {

	const m = new ModuleMap ({
		dir,
	})

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

	const m = new ModuleMap ({
		dir,
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

test ('get', () => {

	const g = (k, ext) => new ModuleMap ({dir, ext}).get (k)
	
	expect (g ('tb_houses')).toStrictEqual ({
		columns: {
			root1_oltp: 1,
			root1_crm_oltp: 1,
			root1_hr_oltp: 1,
			root2_hr_oltp: 1
		}
	})

	expect (() => g ('tb_houses', '.txt')).toThrow ()
	expect (() => g ('vw_houses')).toThrow ()
	expect (() => g (0)).toThrow ()

})

test ('load', () => {

	const m = new ModuleMap ({dir})
	
	expect (m.size).toBe (0)
	
	for (const i of [0, 1]) {
	
		m.load ()
		
		expect ([...m.keys ()]).toStrictEqual (['tb_houses'])
		
		expect ([...m.values ()]).toStrictEqual ([{
			columns: {
				root1_oltp: 1,
				root1_crm_oltp: 1,
				root1_hr_oltp: 1,
				root2_hr_oltp: 1
			}
		}])
	
	}

})