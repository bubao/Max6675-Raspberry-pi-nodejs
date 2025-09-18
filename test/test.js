const Max6675 = require("..");

// Standard SPI: each MAX6675 has its own CS, all share the same SO (MISO)
const CS_LIST = [4, 17, 27, 22, 5]; // Example: 5 MAX6675, each with its own CS
const SCK = 24;
const SO = 25; // All SO pins are wired together to this one GPIO
const UNIT = 1;
// Create a Max6675 instance for each CS
const sensors = CS_LIST.map(cs => new Max6675(cs, SCK, SO, UNIT));

(async () => {
	while (true) {
		for (let i = 0; i < sensors.length; i++) {
			const { temp, unit } = sensors[i].readTemp() || { temp: [], unit: '' };
			if (temp.length)
				console.log(`${new Date()}: CS${CS_LIST[i]}: ${temp[0]}${unit}`);
			else
				console.log(`${new Date()}: CS${CS_LIST[i]}: read error`);
		}
		await sensors[0].sleep(1500);
	}
})();
