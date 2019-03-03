const Max6675 = require("..");

const CS = 4;
const SCK = 24;
const SO = [25, 12, 16, 20, 21];


(async () => {
	const max = new Max6675(CS, SCK, SO, 1);
	while (1) {
		const { temp, unit } = max.readTemp();
		temp.map(item => {
			console.log(new Date + ":" + item + unit);
		});
		await max.sleep(2000);
	}
})();
