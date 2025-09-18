const { Gpio } = require("onoff");
const getValue = Symbol("getValue");
const bin2dec = Symbol("bin2dec");
const format = Symbol("format");

class Max6675 {
	/**
	 * Create a Max6675 instance
	 * @param {number} cs Chip select, BCM GPIO
	 * @param {number} sck Clock, BCM GPIO
	 * @param {number} so Serial data output, BCM GPIO (shared SO/MISO)
	 * @param {number} unit Unit, 1:"°C", 2:"°F", default 1
	 */
	constructor(cs, sck, so, unit = 1) {
		this._released = false;
		this.setPin(cs, sck, so, unit);
		process.on("SIGINT", () => this.stop());
	}

	/**
	 * Release all GPIO resources
	 */
	stop() {
		if (this._released) return;
		this._released = true;
		if (this.CS && typeof this.CS.unexport === 'function') {
			try { this.CS.unexport(); } catch (e) { console.trace(e); }
		}
		if (this.SCK && typeof this.SCK.unexport === 'function') {
			try { this.SCK.unexport(); } catch (e) { console.trace(e); }
		}
		if (this.SO && typeof this.SO.unexport === 'function') {
			try { this.SO.unexport(); } catch (e) { console.trace(e); }
		}
		this.CS = this.SCK = this.SO = null;
	}

	/**
	 * Set pins
	 * @param {number} cs Chip select
	 * @param {number} sck Clock
	 * @param {number|number[]} so Serial output
	 * @param {number} unit Unit
	 * @returns {this}
	 */
	setPin(cs, sck, so, unit = 1) {
		if (this._released) throw new Error('GPIO resources already released.');
		if (typeof cs !== 'number' || typeof sck !== 'number' || typeof so !== 'number') {
			throw new Error('cs, sck, so must all be numbers');
		}
		if (this.CS) try { this.CS.unexport(); } catch (e) {}
		if (this.SCK) try { this.SCK.unexport(); } catch (e) {}
		if (this.SO) try { this.SO.unexport(); } catch (e) {}
		this.cs = cs;
		this.sck = sck;
		this.so = so;
		this.unit = unit;
		this.CS = new Gpio(cs, "low");
		this.SCK = new Gpio(sck, "low");
		this.SO = new Gpio(so, "in");
		return this;
	}

	/**
	 * Delay
	 * @param {number} ms Milliseconds
	 * @returns {Promise<void>}
	 */
	sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Read SO pin values
	 * @returns {number[]}
	 */
	[getValue]() {
		if (!this.SCK || !this.SO) return 0;
		this.SCK.writeSync(1);
		const value = this.SO.readSync();
		this.SCK.writeSync(0);
		return value;
	}

	/**
	 * Read 12-bit binary and convert to decimal
	 * @returns {number[]}
	 */

	[bin2dec]() {
		let value = 0;
		for (let i = 11; i >= 0; --i) {
			value += this[getValue]() * (1 << i);
		}
		return value;
	}


	/**
	 * Format temperature output
	 * @returns {{temp: string[], unit: string}}
	 */

	[format]() {
		const raw = this[bin2dec]();
		if (this.unit === 1) {
			return { temp: [(raw * 0.25).toFixed(2)], unit: "°C" };
		} else if (this.unit === 2) {
			return { temp: [((raw * 0.25 * 9) / 5 + 32).toFixed(2)], unit: "°F" };
		} else {
			return { temp: [raw], unit: "" };
		}
	}

	/**
	 * Read temperature
	 * @returns {{temp: string[], unit: string, error_tc?: number[]}}
	 */
	readTemp() {
		if (!this.CS || !this.SCK || !this.SO) return;
		this.CS.writeSync(0);
		this.CS.writeSync(1, 200);
		this.CS.writeSync(0);
		this[getValue]();
		const results = this[format]();
		const error_tc = this[getValue]();
		this.CS.writeSync(1);
		if (error_tc !== 0) return { temp: [], unit: "", error_tc };
		results.error_tc = error_tc;
		return results;
	}
}

module.exports = Max6675;
