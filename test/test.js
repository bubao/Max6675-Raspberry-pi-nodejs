const Max6675 = require("..");

const CS = 4;
const SCK = 24;
const SO = [25, 12, 16, 20, 21];
const UNIT = 1;

(async () => {
	const max = new Max6675();
	max.setPin(CS, SCK, SO, UNIT);
	while (1) {
		const { temp, unit } = max.readTemp();
		if (temp.length)
			console.log(`${new Date()}:${temp.map(item => item + unit)}`);
		await max.sleep(2000);
	}
})();
