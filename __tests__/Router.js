const {Router} = require ('..')

class Marker {

	constructor (id, label) {
		this.id = id
		this.label = label
	}

	check (m) {
		return m.id == this.id
	}

	process (m) {
		m.label = this.label
	}

}

test ('Router 1', () => {

	const r = new Router ()
	
	r.add (new Marker (1, 'one'))
	
	let m = {id: 1}
	
	r.process (m)	
	
	expect (m).toStrictEqual ({id: 1, label: 'one'})

})

test ('Router 12', () => {

	const r = new Router ()
	
	r
		.add (new Marker (1, 'one'))
		.add (new Marker (2, 'two'))
	
	let m = {id: 1}	
	r.process (m)
	
	expect (m).toStrictEqual ({id: 1, label: 'one'})

	m = {id: 2}	
	r.process (m)
	
	expect (m).toStrictEqual ({id: 2, label: 'two'})

})

test ('Router A', () => {

	const r = new Router ()
	
	r.add ({process: m => m.label = '???'})
	
	let m = {id: 1}
	
	r.process (m)	
	
	expect (m).toStrictEqual ({id: 1, label: '???'})

})
