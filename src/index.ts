/*
 * @Description:
 * @Author: bubao
 * @Date: 2020-04-02 21:02:00
 * @LastEditors: bubao
 * @LastEditTime: 2020-04-04 14:33:12
 */
// tslint:disable-next-line:no-var-requires
const { Gpio } = require("onoff");
import { isArray, verifyGpio } from "./utils";

class Max6675 {
  private unit: number;
  private CS: any;
  private SCK: any;
  private SO: any;

  /**
   * Creates an instance of Max6675.
   * @author bubao
   * @param {number} cs Chip select
   * @param {number} sck CMOS clock
   * @param {(number | number[])} so Serial data output
   * @param {number} [unit=1]
   * @memberof Max6675
   */
  constructor(
    cs?: number,
    sck?: number,
    so?: number | number[],
    unit: number = 1
  ) {
    this.unit = unit;
    so = this.makdeSo(so);
    if (cs && sck && so.length && verifyGpio(cs, sck, so)) {
      this.setPin(cs, sck, so, unit);
    }

    process.on("SIGINT", this.stop);
  }

  async stop() {
    if (this.CS) {
      await this.CS.write(0);
      this.CS.unexport();
    }
    if (this.SCK) {
      await this.SCK.write(0);
      this.SCK.unexport();
    }
    if (this.SO)
      this.SO.map(async (item: any) => {
        await item.write(0);
        item.unexport();
      });
    process.exit();
  }

  private async getValue() {
    await this.SCK.write(1);
    // tslint:disable-next-line:no-return-await
    const value: number[] = this.SO.map(async (item: any) => await item.read());
    await this.SCK.write(0);
    return value;
  }

  private async bin2dec() {
    let arr: number[] = [];
    const value: number[] = [];
    for (let i = 11; i > -1; --i) {
      arr = (await this.getValue()).map((item: number, index: number) => {
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
   * @param {(number | number[])} so Serial data output
   * @param {number} [unit=1]
   */
  setPin(cs: number, sck: number, so: number | number[], unit = 1) {
    this.unit = unit;
    so = this.makdeSo(so);
    if (!(so.length !== 0 && !verifyGpio(cs, sck, so))) {
      this.stop();
      throw new Error("You must assign a value to so!");
    } else {
      this.CS = new Gpio(cs, "low");
      this.SCK = new Gpio(sck, "low");
      this.SO = so.map((item: number) => new Gpio(item, "in"));
    }
  }

  private makdeSo(so: any): number[] {
    return isArray(so) ? so : typeof so === "number" ? [so] : [];
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

  /**
   *
   * @author bubao
   * @date 2020-04-04
   * @private
   * @returns Promise<{
   *    temp: string[];
   *    unit: string;
   * } | {
   *    temp: number[];
   *    unit: string;
   * }>
   * @memberof Max6675
   */
  private async format() {
    switch (this.unit) {
      case 1:
        return {
          temp: (await this.bin2dec()).map((v: number) =>
            (v * 0.25).toFixed(2)
          ),
          unit: "°C",
        };
      case 2:
        return {
          temp: (await this.bin2dec()).map((v: number) =>
            ((v * 0.25 * 9) / 5 + 32).toFixed(2)
          ),
          unit: "°F",
        };
      default:
        return {
          temp: await this.bin2dec(),
          unit: "",
        };
    }
  }

  /**
   * @description read temp
   * @author bubao
   * @returns Promise<{
   *      temp?: undefined;
   *      unit?: undefined;
   *      error_tc?: undefined;
   *  } | {
   *      temp: any[];
   *      unit: string;
   *      error_tc: number[];
   *  }>
   */
  async readTemp() {
    if (!(this.CS && this.SCK && this.SO)) return {};
    await this.CS.write(0);
    await this.CS.write(1, 200);
    await this.CS.write(0);

    await this.getValue();
    const results = await this.format();
    const ErrorTc = await this.getValue();
    await this.CS.write(1);

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
export = Max6675;
