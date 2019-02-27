const Max6675 = require(".");

const CS = 7;
const SCK = 18;
const SO = 22;

(async () => {
	const max = new Max6675(CS, SCK, SO, 1);
	let value;
	while (1) {
		value = await max.readTemp(CS);
		console.log(value);
		await max.sleep(200);
	}
})();

// let value = 0

// // let c = [0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0]
// let c = "000101100000"
// for (let i = 11; i > -1; i--) {
// 	console.log(c[i])
// 	value += (parseInt(c[i]) * Math.pow(2, i));
// }



// value *= 0.25
// console.log(value)
// console.log(value.toString(2))
