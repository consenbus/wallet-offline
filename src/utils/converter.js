import BigNumber from "bignumber.js";

// type BusUnit = raw | nBUS | uBUS | mBUS | BUS | kBUS | MBUS | GBUS
const units = {
  GBUS: BigNumber("1e36"),
  MBUS: BigNumber("1e33"),
  kBUS: BigNumber("1e30"),
  BUS: BigNumber("1e27"),
  mBUS: BigNumber("1e24"),
  uBUS: BigNumber("1e21"),
  nBUS: BigNumber("1e18"),
  raw: BigNumber("1e0")
};

const fee = BigNumber("1e25");
const rate = BigNumber("0.2");

const converter = {
  unit(
    input /* : string | number */,
    inUnit /* : NanoUnit */,
    outUnit /* : NanoUnit */
  ) {
    const inTimes = units[inUnit];
    const outTimes = units[outUnit];
    if (!inTimes) throw Error(`Non-exists unit: ${inUnit}`);
    if (!outTimes) throw Error(`Non-exists unit: ${outUnit}`);
    const value = new BigNumber(input.toString());

    const output = inTimes.multipliedBy(value).dividedBy(outTimes);
    if (outUnit === "raw") return output.toString(10);
    return output.toFixed(6);
  },

  minus(base /* : string */, minus /* : string */) {
    return new BigNumber(base).minus(new BigNumber(minus)).toFixed(0);
  },

  plus(base /* : string */, plus /* : string */) {
    return new BigNumber(base).plus(new BigNumber(plus)).toFixed(0);
  },
  minusFee(base /* : string */) {
    return new BigNumber(base || "0")
      .minus(fee)
      .dividedBy(units.BUS)
      .toFixed(6);
  },
  dollar(base /* : string */) {
    return new BigNumber(base || "0")
      .multipliedBy(rate)
      .dividedBy(units.BUS)
      .toFixed(6);
  }
};

export default converter;
