const Max6675 = require("./index");

const CS = 4;
const SCK = 24;
const SO = 25;
// const SO = [26, 27, 28, 29];

(async () => {
	const max = new Max6675(CS, SCK, SO, 1);
	while (1) {
		const { temp, unit } = max.readTemp();
		temp.map((item, index) => {
			console.log(new Date + ":" + item + unit);
		})
		await max.sleep(2000);
	}
})();

// let a = "001011000000"
// let b = "000101100000"
// let c = "000010110000"

// const bin2dec = (c, value) => {
// 	for (let i = 11; i > -1; i--) {
// 		// value += (parseInt(c[i]) * Math.pow(2, i));
// 		value += parseInt(c[i]) << i;
// 	}
// 	return value;
// }
// console.log((bin2dec(a, 0) * 0.25).toFixed(2));
// console.log((bin2dec(b, 0) * 0.25).toFixed(2));
// console.log((bin2dec(c, 0) * 0.25).toFixed(2));

