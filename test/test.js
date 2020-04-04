/**
 * @Description: 
 * @Author: bubao
 * @Date: 2019-02-27 23:17:02
 * @LastEditors: bubao
 * @LastEditTime: 2020-04-04 10:48:51
 */
// import Max6675 from "../src";
const Max6675 = require('../dist')
const CS = 4;
const SCK = 24;
const SO = [25, 12, 16, 20, 21];
const UNIT = 1;
const max6675 = new Max6675();
max6675.setPin(CS, SCK, SO, UNIT);

(async () => {
	while (true) {
		const { temp, unit } = max6675.readTemp();
		if (temp.length)
			console.log(`${new Date()}:${temp.map(item => item + unit)}`);
		await max6675.sleep(2000);
	}
})();
