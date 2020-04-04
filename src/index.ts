/*
 * @Description:
 * @Author: bubao
 * @Date: 2020-04-02 21:02:00
 * @LastEditors: bubao
 * @LastEditTime: 2020-04-04 10:57:59
 */
// tslint:disable-next-line:no-var-requires
const { Gpio } = require("onoff");
// import { Gpio } from "onoff";

class Max6675 {
  sck: number;
  cs: number;
  so: number | number[];
  unit: number;
  CS: any;
  SCK: any;
  SO: any;

  /**
   * Creates an instance of Max6675.
   * @author bubao
   * @param {number} cs Chip select
   * @param {number} sck CMOS clock
   * @param {number | array} so Serial data output
   * @param {number} [unit=1]
   */
  constructor(
    cs: number,
    sck: number,
    so: number | number[],
    unit: number = 1
  ) {
    this.cs = cs;
    this.sck = sck;
    this.so = this.isArray(so) ? so : typeof so === "number" ? [so] : [];
    this.unit = unit;
    if (this.cs && this.sck && this.so && this.unit)
      this.setPin(this.cs, this.sck, this.so, this.unit);
    process.on("SIGINT", () => this.stop());
  }

  private isArray(obj: number | number[]): boolean {
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
      this.SO.map((item: any) => {
        item.writeSync(0);
        item.unexport();
      });
    process.exit();
  }

  private getValue(): number[] {
    this.SCK.writeSync(1);
    const value = this.SO.map((item: any) => item.readSync());
    this.SCK.writeSync(0);
    return value;
  }

  private bin2dec(): number[] {
    let arr: number[] = [];
    const value: number[] = [];
    for (let i = 11; i > -1; --i) {
      arr = this.getValue().map((item: number, index: number) => {
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
  setPin(
    cs = this.cs,
    sck = this.sck,
    so: number | number[],
    unit = this.unit
  ) {
    this.cs = cs;
    this.sck = sck;
    this.unit = unit;
    this.so = this.makdeSo(so);
    if (this.so.length === 0) {
      this.stop();
      throw new Error("You must assign a value to so!");
    } else {
      this.CS = new Gpio(this.cs, "low");
      this.SCK = new Gpio(this.sck, "low");
      this.SO = this.so.map((item: number) => new Gpio(item, "in"));
    }
  }

  private makdeSo(so: any): number[] {
    return this.isArray(so) ? so : typeof so === "number" ? [so] : [];
  }
  /**
   * @description delay
   * @author bubao
   * @param {number} ms
   * @returns Promise<any>
   */
  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private format(): object {
    switch (this.unit) {
      case 1:
        return {
          temp: this.bin2dec().map((v: number) => (v * 0.25).toFixed(2)),
          unit: "°C",
        };
      case 2:
        return {
          temp: this.bin2dec().map((v: number) =>
            ((v * 0.25 * 9) / 5 + 32).toFixed(2)
          ),
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
    if (!(this.CS && this.SCK && this.SO)) return;
    this.CS.writeSync(0);
    this.CS.writeSync(1, 200);
    this.CS.writeSync(0);

    this.getValue();
    const results = this.format();
    const ErrorTc = this.getValue();
    this.CS.writeSync(1);

    let error = 0;

    ErrorTc.forEach((element: number) => {
      if (element !== 0) error += 1;
    });

    if (error !== 0) {
      const temp: any[] = [];
      return { temp, unit: "", error_tc: ErrorTc };
    }
    return { ...results, error_tc: ErrorTc };
  }
}

// export default Max6675;
export = Max6675;
