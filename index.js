const { Gpio } = require("onoff");
const stop = Symbol('stop');
const getValue = Symbol('getValue');
const bin2dec = Symbol('bin2dec');

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
		process.on('SIGINT', this[stop]);
	}

	[stop](cb = () => process.exit()) {
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

	[getValue]() {
		this.sck.writeSync(1);
		const value = this.so.readSync();
		this.sck.writeSync(0);
		return value;
	}

	[bin2dec]() {
		let value = 0;
		for (let i = 11; i > -1; --i) {
			// value += this[getValue]() * Math.pow(2, i);
			value += this[getValue]() << i;
		}
		return value;
	}
	/**
	 * @description setPin
	 * @author bubao
	 * @param {number} CS
	 * @param {number} SCK
	 * @param {number} SO
	 * @param {number} UNIT
	 */
	setPin(CS, SCK, SO, UNIT) {
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

	format(value, UNIT = 1) {
		let temp;
		switch (UNIT) {
			case 1:
				temp = value * 0.25;
				unit = "°C";
				break;
			case 2:
				temp = value * 0.25 * 9 / 5 + 32;
				unit = "°F";
				break;
			default:
				temp = value;
				break;
		}
		return { temp, unit };
	}

	/**
	 * @description read temp
	 * @author bubao
	 * @returns
	 */
	readTemp() {
		if (!(this.cs && this.sck && this.so)) return;
		this.cs.writeSync(0, 2);
		this.cs.writeSync(1, 200);
		this.cs.writeSync(0);

		this[getValue]();
		const value = this[bin2dec]();
		const error_tc = this[getValue]();
		this.cs.writeSync(1);

		const { temp, unit } = this.format(value, this.UNIT);

		if (error_tc != 0) return new Error("error: can't get temp");
		return {
			temp: temp.toFixed(2),
			unit
		};
	}
}
