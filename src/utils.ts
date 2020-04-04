/*
 * @Description:
 * @Author: bubao
 * @Date: 2020-04-04 12:28:17
 * @LastEditors: bubao
 * @LastEditTime: 2020-04-04 12:55:17
 */

export function isArray(obj: number | number[]): boolean {
  return Object.prototype.toString.call(obj) === "[object Array]";
}

export function verifyGpio(sck: number, cs: number, so: number[]) {
  const set = new Set(so);
  set.add(sck);
  set.add(cs);
  return set.size === so.length + 2;
}
