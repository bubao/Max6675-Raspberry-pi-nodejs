const Max6675 = require("..");

const CS = 4;
const SCK = 24;
const SO = [25, 12, 16, 20, 21];
const UNIT = 1;
const max6675 = new Max6675();
max6675.setPin(CS, SCK, SO, UNIT);

(async () => {
	while (1) {
		const { temp, unit } = max6675.readTemp();
		if (temp.length)
			console.log(`${new Date()}:${temp.map(item => item + unit)}`);
		await max.sleep(2000);
	}
})();
