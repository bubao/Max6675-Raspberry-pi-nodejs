"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * @Description:
 * @Author: bubao
 * @Date: 2020-04-02 21:02:00
 * @LastEditors: bubao
 * @LastEditTime: 2020-04-02 23:28:34
 */
const { Gpio } = require("onoff");
// import { Gpio } from "onoff";
class Max6675 {
    /**
     * Creates an instance of Max6675.
     * @author bubao
     * @param {number} cs Chip select
     * @param {number} sck CMOS clock
     * @param {number | array} so Serial data output
     * @param {number} [unit=1]
     */
    constructor(cs, sck, so, unit = 1) {
        this.cs = cs;
        this.sck = sck;
        this.so = this.isArray(so) ? so : typeof so === "number" ? [so] : [];
        this.unit = unit;
        if (this.cs && this.sck && this.so && this.unit)
            this.setPin(this.cs, this.sck, this.so, this.unit);
        process.on("SIGINT", () => this.stop());
    }
    isArray(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    }
    stop() {
        if (this.CS) {
            this.CS.writeSync(0);
            this.CS.unexport();
        }
        if (this.SCK) {
            this.SCK.writeSync(0);
            this.SCK.unexport();
        }
        if (this.SO)
            this.SO.map((item) => {
                item.writeSync(0);
                item.unexport();
            });
        process.exit();
    }
    getValue() {
        this.SCK.writeSync(1);
        const value = this.SO.map((item) => item.readSync());
        this.SCK.writeSync(0);
        return value;
    }
    bin2dec() {
        let arr = [];
        const value = [];
        for (let i = 11; i > -1; --i) {
            arr = this.getValue().map((item, index) => {
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
     */
    setPin(cs = this.cs, sck = this.sck, so, unit = this.unit) {
        this.cs = cs;
        this.sck = sck;
        this.unit = unit;
        this.so = this.makdeSo(so);
        if (this.so.length === 0) {
            this.stop();
            throw new Error("You must assign a value to so!");
        }
        else {
            this.CS = new Gpio(this.cs, "low");
            this.SCK = new Gpio(this.sck, "low");
            this.SO = this.so.map((item) => new Gpio(item, "in"));
        }
    }
    makdeSo(so) {
        return this.isArray(so) ? so : typeof so === "number" ? [so] : [];
    }
    /**
     * @description delay
     * @author bubao
     * @param {number} ms
     * @returns Promise<any>
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    format() {
        switch (this.unit) {
            case 1:
                return {
                    temp: this.bin2dec().map((v) => (v * 0.25).toFixed(2)),
                    unit: "°C",
                };
            case 2:
                return {
                    temp: this.bin2dec().map((v) => ((v * 0.25 * 9) / 5 + 32).toFixed(2)),
                    unit: "°F",
                };
            default:
                return {
                    temp: this.bin2dec(),
                    unit: "",
                };
        }
    }
    /**
     * @description read temp
     * @author bubao
     * @returns
     */
    readTemp() {
        if (!(this.CS && this.SCK && this.SO))
            return;
        this.CS.writeSync(0);
        this.CS.writeSync(1, 200);
        this.CS.writeSync(0);
        this.getValue();
        const results = this.format();
        const ErrorTc = this.getValue();
        this.CS.writeSync(1);
        let error = 0;
        ErrorTc.forEach((element) => {
            if (element !== 0)
                error += 1;
        });
        if (error !== 0) {
            const temp = [];
            return { temp, unit: "", error_tc: ErrorTc };
        }
        return Object.assign(Object.assign({}, results), { error_tc: ErrorTc });
    }
}
exports.Max6675 = Max6675;
exports.default = Max6675;
