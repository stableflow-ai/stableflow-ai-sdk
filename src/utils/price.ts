export function getPrice(prices: Record<string, string>, symbol: string) {
  let price = "1";
  if (prices[symbol]) {
    price = prices[symbol];
    if (price !== "0") {
      return price;
    }
  }
  if (prices[symbol.toLowerCase()]) {
    price = prices[symbol.toLowerCase()];
    if (price !== "0") {
      return price;
    }
  }
  if (prices[symbol.toUpperCase()]) {
    price = prices[symbol.toUpperCase()];
    if (price !== "0") {
      return price;
    }
  }
  return "1";
}
