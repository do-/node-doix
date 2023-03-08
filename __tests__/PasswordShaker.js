const Path = require ('path')
const {PasswordShaker} = require ('..')

const path = Path.join (__dirname, 'data', 'pepper.txt')

test ('basic', () => {

	const pwd = new PasswordShaker ({path})
	
	expect (String (pwd.pepper)).toBe ('pepper')

	expect (pwd.test ('18a8db53d980ee88a64078c8a9dbf63131e4c18751d96568051219fd062eead1', 'pass')).toBe (true)

	expect (pwd.test ('c92fda7ed203b63eaaba63bd60ecff0b122085c5a5a184856f542dc6d58ef96f', 'pass', '1234')).toBe (true)

})

test ('sprinkle', () => {

	const pwd = new PasswordShaker ({path})
	
	expect (pwd.sprinkle (10)).toHaveLength (20)

})
