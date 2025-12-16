export const numberRemoveEndZero = (value: string) => {
  return value.replace("-", "").replace(/\.?0+$/, "");
};
