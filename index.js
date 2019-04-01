const { Gpio } = require("onoff");
const getValue = Symbol("getValue");
const bin2dec = Symbol("bin2dec");
const isArray = Symbol("isArray");
const format = Symbol("format");

module.exports = class Max6675 {
	/**
	 *Creates an instance of Max6675.
	 * @author bubao
	 * @param {number} cs Chip select
	 * @param {number} sck CMOS clock
	 * @param {number | array} so Serial data output
	 * @param {number} [unit=1]
	 */
	constructor(cs, sck, so, unit = 1) {
		this.cs = cs;
		this.sck = sck;
		this.so = this[isArray](so) ? so : typeof so === "number" ? [so] : [];
		this.unit = unit;
		if (this.cs && this.sck && this.so && this.unit)
			this.setPin(this.cs, this.sck, this.so, this.unit);
		process.on("SIGINT", () => this.stop());
	}

	[isArray](obj) {
		return Object.prototype.toString.call(obj) == "[object Array]";
	}

	stop() {
		if (this.cs) {
			this.cs.writeSync(0);
			this.cs.unexport();
		}
		if (this.sck) {
			this.sck.writeSync(0);
			this.sck.unexport();
		}
		if (this.so)
			this.so.map(item => {
				item.writeSync(0);
				item.unexport();
			});
		process.exit();
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
			arr = this[getValue]().map((item, index) => {
				value[index] = (value[index] || 0) + item * Math.pow(2, i);
				return value[index];
			});
		}
		return arr;
	}
	/**
	 * @description
	 * @author bubao
	 * @param {number} cs Chip select
	 * @param {number} sck CMOS clock
	 * @param {number | array} so Serial data output
	 * @param {number} [unit=1]
	 * @returns this
	 */
	setPin(cs = this.cs, sck = this.sck, so, unit = this.unit) {
		this.cs = cs;
		this.sck = sck;
		this.unit = unit;
		this.so = this[isArray](so)
			? so
			: typeof so === "number"
			? [so]
			: this.so;
		if (this.so.length === 0) {
			console.error("You must assign a value to so!");
			this.stop();
		} else {
			this.cs = new Gpio(this.cs, "low");
			this.sck = new Gpio(this.sck, "low");
			this.so = this.so.map(item => new Gpio(item, "in"));
			return this;
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

	[format]() {
		switch (this.unit) {
			case 1:
				return {
					temp: this[bin2dec]().map(v => (v * 0.25).toFixed(2)),
					unit: "°C"
				};
			case 2:
				return {
					temp: this[bin2dec]().map(v =>
						((v * 0.25 * 9) / 5 + 32).toFixed(2)
					),
					unit: "°F"
				};
			default:
				return {
					temp: this[bin2dec](),
					unit: ""
				};
		}
	}

	/**
	 * @description read temp
	 * @author bubao
	 * @returns
	 */
	readTemp() {
		if (!(this.cs && this.sck && this.so)) return;
		this.cs.writeSync(0);
		this.cs.writeSync(1, 200);
		this.cs.writeSync(0);

		this[getValue]();
		const results = this[format]();
		const error_tc = this[getValue]();
		this.cs.writeSync(1);

		let error = 0;

		error_tc.forEach(element => {
			if (element !== 0) error += 1;
		});
		results.error_tc = error_tc;
		if (error !== 0) return { temp: [], unit: "", error_tc };
		return results;
	}
};
