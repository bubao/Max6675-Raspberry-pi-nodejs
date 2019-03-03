const { Gpio } = require("onoff");
const stop = Symbol('stop');
const getValue = Symbol('getValue');
const bin2dec = Symbol('bin2dec');
const isArray = Symbol('isArray');
const format = Symbol('format');

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
		this.SO = this[isArray](SO) ? SO : (typeof SO === "number" ? [SO] : []);
		this.UNIT = UNIT;
		if (this.CS && this.SCK && this.SO && this.UNIT) this.setPin(this.CS, this.SCK, this.SO, this.UNIT);
		process.on('SIGINT', () => this[stop]());
	}

	[isArray](obj) {
		return Object.prototype.toString.call(obj) == '[object Array]';
	}

	[stop](cb = () => process.exit()) {
		if (this.cs) {
			this.cs.writeSync(0);
			this.cs.unexport();
		} if (this.sck) {
			this.sck.writeSync(0);
			this.sck.unexport();
		} if (this.so) {
			this.so.map(item => item.unexport());
		}
		cb();
	}

	[getValue]() {
		this.sck.writeSync(1);
		const value = this.so.map(item => item.readSync());
		this.sck.writeSync(0);
		return value;
	}

	[bin2dec]() {
		let arr = [];
		let value = [];
		for (let i = 11; i > -1; --i) {
			// value += this[getValue]() * Math.pow(2, i);
			// value += this[getValue]() << i;
			arr = this[getValue]().map((item, index) => {
				value[index] = (value[index] || 0) + item * Math.pow(2, i);
				return value[index];
			});
		}
		return arr;
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
		this.SO = this[isArray](SO) ? SO : (typeof SO === "number" ? [SO] : this.SO);
		this.UNIT = UNIT || this.UNIT;
		if (this.SO.length === 0) {
			console.log("You must assign a value to SO!");
			delete this;
			process.exit();
		} else {
			this.cs = new Gpio(this.CS, "low");
			this.sck = new Gpio(this.SCK, "low");
			this.so = this.SO.map(item => new Gpio(item, "in"));
		}
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

	[format](value, UNIT = 1) {
		let temp;
		let unit = "";

		if (UNIT === 1) {
			temp = value.map(v => (v * 0.25).toFixed(2));
			unit = "°C";
		} else if (UNIT === 2) {
			temp = value.map(v => (v * 0.25 * 9 / 5 + 32).toFixed(2));
			unit = "°F";
		} else {
			temp = value;
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

		const results = this[format](value, this.UNIT);
		error_tc.forEach(element => {
			if (element !== 0) error_tc += 1
		});
		if (error_tc !== 0) return new Error("error: can't get temp");
		return results;
	}
}
