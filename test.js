const Max6675 = require("./index");

const CS = 4;
const SCK = 24;
const SO = 25;

(async () => {
	const max = new Max6675(CS, SCK, SO, 1);
	while (1) {
		const { temp, time, unit } = await max.readTemp();
		console.log(time + ":" + temp + unit);
		await max.sleep(2000);
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
