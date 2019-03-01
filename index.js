const { Gpio } = require("onoff");

module.exports = class Max6675 {
	/**
	 *Creates an instance of Max6675.
	 * @author bubao
	 * @param {number} CS
	 * @param {number} SCK
	 * @param {number} SO
	 * @param {number} [UNIT=1]
	 */
	constructor(CS, SCK, SO, UNIT = 1) {
		this.CS = CS;
		this.SCK = SCK;
		this.SO = SO;
		this.UNIT = UNIT;
		if (this.CS && this.SCK && this.SO && this.UNIT) this.setPin(this.CS, this.SCK, this.SO, this.UNIT);
		process.on('SIGINT', () => {
			this.stop(() => {
				console.log('Max6675 exit now!');
				process.exit();
			});
		});
	}
	/**
	 * @description setPin
	 * @author bubao
	 * @param {number} CS
	 * @param {number} SCK
	 * @param {number} SO
	 * @param {number} [UNIT=1]
	 */
	setPin(CS, SCK, SO, UNIT = 1) {
		this.CS = CS || this.CS;
		this.SCK = SCK || this.SCK;
		this.SO = SO || this.SO;
		this.UNIT = UNIT || this.UNIT;

		this.cs = new Gpio(this.CS, "low");
		this.sck = new Gpio(this.SCK, "low");
		this.so = new Gpio(this.SO, "in");
	}
	/**
	 * @description delay
	 * @author bubao
	 * @param {number} ms
	 * @returns Promise<any>
	 */
	sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * @description stop
	 * @author bubao
	 * @param {function} [cb=() => { process.exit();}]
	 */
	stop(cb = () => { process.exit() }) {
		if (this.cs) {
			this.cs.writeSync(0);
			this.cs.unexport();
		} if (this.sck) {
			this.sck.writeSync(0);
			this.sck.unexport();
		} if (this.so) {
			this.so.unexport();
		}
		cb();
	}

	/**
	 * @description read temp
	 * @author bubao
	 * @returns
	 */
	async readTemp() {
		let value = 0;
		let temp = 0;
		let unit = "";

		this.cs.writeSync(0, 2);
		this.cs.writeSync(1);
		await this.sleep(200);
		this.cs.writeSync(0);
		this.sck.writeSync(1, 1);
		this.sck.writeSync(0);

		for (let i = 11; i > -1; --i) {
			this.sck.writeSync(1);
			value += this.so.readSync() * Math.pow(2, i);
			this.sck.writeSync(0);
		}
		this.sck.writeSync(1);
		const error_tc = this.so.readSync();
		this.sck.writeSync(0);
		for (let i = 2; i > 0; i--) {
			this.sck.writeSync(1, 1);
			this.sck.writeSync(0, 1);
		}
		this.sck.writeSync(1, 1);
		this.sck.writeSync(0);
		switch (this.UNIT) {
			case 0:
				temp = value;
				break;
			case 1:
				temp = value * 0.25;
				temp = temp.toFixed(2);
				unit = "°F";
				break;
			case 2:
				temp = value * 0.25 * 9 / 5 + 32;
				temp = temp.toFixed(2);
				unit = "°F";
				break;
			default:
				break;
		}
		if (error_tc != 0) return new Error("error: can't get temp");
		else return {
			temp, unit, time: new Date
		};
	}
}
