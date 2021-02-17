# Max6675

[![NPM version](https://img.shields.io/npm/v/max6675-raspi.svg)](https://www.npmjs.com/package/max6675-raspi) [![jaywcjlove/sb](https://jaywcjlove.github.io/sb/lang/english.svg)](README.md)

在树莓派上使用 Node.js 驱动 Max6675 芯片，读取 K 型热偶的温度值。

```sh
npm i max6675-raspi --save
```

![Max6675](https://github.com/bubao/Max6675-Raspberry-pi-nodejs/raw/master/imgs/Max6675.png)

## API

### `Max6675`

```js
const Max6675 = require("max6675-raspi");
const CS = 4;
const SCK = 24;
const SO = [25, 12, 16, 20, 21];
const UNIT = 1;

const max6675 = new Max6675(CS, SCK, SO, UNIT);
```

可以接收 4 个参数：

- `CS`: Max6675 模块的`CS`脚对应的树莓派的 GPIO 号。
- `SCK`: Max6675 模块的`SCK`脚对应的树莓派的 GPIO 号。
- `SO`: Max6675 模块的`SO`脚对应的树莓派的 GPIO 号，可以接收一个数组，也可以接收一个整数。
- `UNIT`: 设置结果输出单位，`1`为`°C`，`0`为`°F`，不传参数则默认值为`1`，传其他值则直接返回`Max6675`芯片的二进制数转十进制数值。

### `setPin`

```js
const Max6675 = require("max6675-raspi");

const CS = 4;
const SCK = 24;
const SO = [25, 12, 16, 20, 21];
const UNIT = 1;

// const max = new Max6675(CS, SCK, SO, UNIT);
const max6675 = new Max6675();
max6675.setPin(CS, SCK, SO, UNIT);
```

如果你在`new Max6675()`的时候没有传参数，就可以调用这个方法设置针脚信息。与`Max6675`一样接收四个参数：

- `CS`: Max6675 模块的`CS`脚对应的树莓派的 GPIO 号。
- `SCK`: Max6675 模块的`SCK`脚对应的树莓派的 GPIO 号。
- `SO`: Max6675 模块的`SO`脚对应的树莓派的 GPIO 号，可以接收一个数组，也可以接收一个整数。
- `UNIT`: 设置结果输出单位，`1`为`°C`，`2`为`°F`，不传参数则默认值为`1`，传其他值则直接返回`Max6675`芯片的二进制数转十进制数值。

### `readTemp`

在设定了`CS`，`SCK`，`SO`和`UNIT`（默认值为`1`) 后，即能调用这个方法来获取值。

```js
const Max6675 = require("max6675-raspi");

const CS = 4;
const SCK = 24;
const SO = [25, 12, 16, 20, 21];
const UNIT = 1;
const max6675 = new Max6675();
max6675.setPin(CS, SCK, SO, UNIT);
const { temp, unit } = max6675.readTemp();
console.log(`${new Date()}:${temp.map(item => item + unit)}`);
```

`setPin`之后也可以立即调用`readTemp`

```js
const Max6675 = require("max6675-raspi");

const CS = 4;
const SCK = 24;
const SO = [25, 12, 16, 20, 21];
const UNIT = 1;
const max6675 = new Max6675();
const { temp, unit } = max6675.setPin(CS, SCK, SO, UNIT).readTemp();
console.log(`${new Date()}:${temp.map(item => item + unit)}`);
```

### `sleep`

这是个用`Promise`封装的延时器。当你需要循环获取值，但又不想自己写延时器的时候，可以像下面一样使用这个`sleep`方法。

```js
const Max6675 = require("max6675-raspi");

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
```

![PIN](https://user-images.githubusercontent.com/13029001/107857184-c58d7100-6e67-11eb-93b1-8a4ebc9c9309.png)

The PINs value is BCM GPIOs (green).

## GPIO

这里特地提 GPIO，`SO`，`CS`，`SCK`的值，是树莓派上的 BCM GPIO（绿色），不是针脚号。

引用一张 [`https://github.com/splitbrain/rpibplusleaf`](https://github.com/splitbrain/rpibplusleaf) 的图片。

[![rpiblusleaf](https://raw.githubusercontent.com/splitbrain/rpibplusleaf/master/rpiblusleaf.png)](https://github.com/splitbrain/rpibplusleaf)
