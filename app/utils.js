/**
 * @param {number} a 
 * @param {number} b 
 * @returns random int between a and b (inclusive)
 */
const randomInt = (a, b) => a + Math.floor(Math.random()*(b+1));

/**
 * @returns a function that, when called, will generate a new ID each time
 */
const idGenerator = () => {
	let id = 0;
	return () => id++;
};


module.exports = { randomInt, idGenerator}
