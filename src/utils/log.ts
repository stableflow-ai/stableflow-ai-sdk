export type StyleScale = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
export type StyleColor = "red" | "yellow" | "green" | "blue" | "sky" | "teal" | "purple" | "pink" | "rose" | "gray" | "indigo" | "fuchsia" | "stone" | "lime";

const logStyles: Record<`${StyleColor}-${StyleScale}`, string> = {
  "red-50": "background:oklch(97.1% 0.013 17.38);color:#000;",
  "red-100": "background:oklch(93.6% 0.032 17.717);color:#000;",
  "red-200": "background:oklch(88.5% 0.062 18.334);color:#000;",
  "red-300": "background:oklch(80.8% 0.114 19.571);color:#000;",
  "red-400": "background:oklch(70.4% 0.191 22.216);color:#fff;",
  "red-500": "background:oklch(63.7% 0.237 25.331);color:#fff;",
  "red-600": "background:oklch(57.7% 0.245 27.325);color:#fff;",
  "red-700": "background:oklch(50.5% 0.213 27.518);color:#fff;",
  "red-800": "background:oklch(44.4% 0.177 26.899);color:#fff;",
  "red-900": "background:oklch(39.6% 0.141 25.723);color:#fff;",
  "red-950": "background:oklch(25.8% 0.092 26.042);color:#fff;",

  "yellow-50": "background:oklch(98.73% 0.0262 102.21);color:#000;",
  "yellow-100": "background:oklch(97.29% 0.0693 103.19);color:#000;",
  "yellow-200": "background:oklch(94.51% 0.1243 101.54);color:#000;",
  "yellow-300": "background:oklch(90.52% 0.1657 98.11);color:#000;",
  "yellow-400": "background:oklch(86.06% 0.1731 91.94);color:#fff;",
  "yellow-500": "background:oklch(79.52% 0.1617 86.05);color:#fff;",
  "yellow-600": "background:oklch(68.06% 0.1423 75.83);color:#fff;",
  "yellow-700": "background:oklch(55.38% 0.1207 66.44);color:#fff;",
  "yellow-800": "background:oklch(47.62% 0.1034 61.91);color:#fff;",
  "yellow-900": "background:oklch(42.1% 0.0897 57.71);color:#fff;",
  "yellow-950": "background:oklch(28.57% 0.0639 53.81);color:#fff;",

  "green-50": "background:oklch(98.19% 0.0181 155.83);color:#000;",
  "green-100": "background:oklch(96.24% 0.0434 156.74);color:#000;",
  "green-200": "background:oklch(92.5% 0.0806 155.99);color:#000;",
  "green-300": "background:oklch(87.12% 0.1363 154.45);color:#000;",
  "green-400": "background:oklch(80.03% 0.1821 151.71);color:#fff;",
  "green-500": "background:oklch(72.27% 0.192 149.58);color:#fff;",
  "green-600": "background:oklch(62.71% 0.1699 149.21);color:#fff;",
  "green-700": "background:oklch(52.73% 0.1371 150.07);color:#fff;",
  "green-800": "background:oklch(44.79% 0.1083 151.33);color:#fff;",
  "green-900": "background:oklch(39.25% 0.0896 152.54);color:#fff;",
  "green-950": "background:oklch(26.64% 0.0628 152.93);color:#fff;",

  "blue-50": "background:oklch(97.05% 0.0142 254.6);color:#000;",
  "blue-100": "background:oklch(93.19% 0.0316 255.59);color:#000;",
  "blue-200": "background:oklch(88.23% 0.0571 254.13);color:#000;",
  "blue-300": "background:oklch(80.91% 0.0956 251.81);color:#000;",
  "blue-400": "background:oklch(71.37% 0.1434 254.62);color:#fff;",
  "blue-500": "background:oklch(62.31% 0.188 259.81);color:#fff;",
  "blue-600": "background:oklch(54.61% 0.2152 262.88);color:#fff;",
  "blue-700": "background:oklch(48.82% 0.2172 264.38);color:#fff;",
  "blue-800": "background:oklch(42.44% 0.1809 265.64);color:#fff;",
  "blue-900": "background:oklch(37.91% 0.1378 265.52);color:#fff;",
  "blue-950": "background:oklch(28.23% 0.0874 267.94);color:#fff;",

  "sky-50": "background:oklch(97.71% 0.0125 236.62);color:#000;",
  "sky-100": "background:oklch(95.14% 0.025 236.82);color:#000;",
  "sky-200": "background:oklch(90.14% 0.0555 230.9);color:#000;",
  "sky-300": "background:oklch(82.76% 0.1013 230.32);color:#000;",
  "sky-400": "background:oklch(75.35% 0.139 232.66);color:#fff;",
  "sky-500": "background:oklch(68.47% 0.1479 237.32);color:#fff;",
  "sky-600": "background:oklch(58.76% 0.1389 241.97);color:#fff;",
  "sky-700": "background:oklch(50% 0.1193 242.75);color:#fff;",
  "sky-800": "background:oklch(44.34% 0.1 240.79);color:#fff;",
  "sky-900": "background:oklch(39.12% 0.0845 240.88);color:#fff;",
  "sky-950": "background:oklch(29.35% 0.0632 243.16);color:#fff;",

  "teal-50": "background:oklch(98.36% 0.0142 180.72);color:#000;",
  "teal-100": "background:oklch(95.27% 0.0498 180.8);color:#000;",
  "teal-200": "background:oklch(91% 0.0927 180.43);color:#000;",
  "teal-300": "background:oklch(85.49% 0.1251 181.07);color:#000;",
  "teal-400": "background:oklch(78.45% 0.1325 181.91);color:#fff;",
  "teal-500": "background:oklch(70.38% 0.123 182.5);color:#fff;",
  "teal-600": "background:oklch(60.02% 0.1038 184.7);color:#fff;",
  "teal-700": "background:oklch(51.09% 0.0861 186.39);color:#fff;",
  "teal-800": "background:oklch(43.7% 0.0705 188.22);color:#fff;",
  "teal-900": "background:oklch(38.61% 0.059 188.42);color:#fff;",
  "teal-950": "background:oklch(27.73% 0.0447 192.52);color:#fff;",

  "purple-50": "background:oklch(97.68% 0.0142 308.3);color:#000;",
  "purple-100": "background:oklch(94.64% 0.0327 307.17);color:#000;",
  "purple-200": "background:oklch(90.24% 0.0604 306.7);color:#000;",
  "purple-300": "background:oklch(82.68% 0.1082 306.38);color:#000;",
  "purple-400": "background:oklch(72.17% 0.1767 305.5);color:#fff;",
  "purple-500": "background:oklch(62.68% 0.2325 303.9);color:#fff;",
  "purple-600": "background:oklch(55.75% 0.2525 302.32);color:#fff;",
  "purple-700": "background:oklch(49.55% 0.2369 301.92);color:#fff;",
  "purple-800": "background:oklch(43.83% 0.1983 303.72);color:#fff;",
  "purple-900": "background:oklch(38.07% 0.1661 304.99);color:#fff;",
  "purple-950": "background:oklch(29.05% 0.1432 302.72);color:#fff;",

  "pink-50": "background:oklch(97.14% 0.0141 343.2);color:#000;",
  "pink-100": "background:oklch(94.82% 0.0276 342.26);color:#000;",
  "pink-200": "background:oklch(89.94% 0.0589 343.23);color:#000;",
  "pink-300": "background:oklch(82.28% 0.1095 346.02);color:#000;",
  "pink-400": "background:oklch(72.53% 0.1752 349.76);color:#fff;",
  "pink-500": "background:oklch(65.59% 0.2118 354.31);color:#fff;",
  "pink-600": "background:oklch(59.16% 0.218 354.58);color:#fff;",
  "pink-700": "background:oklch(52.46% 0.199 353.96);color:#fff;",
  "pink-800": "background:oklch(45.87% 0.1697 353.82);color:#fff;",
  "pink-900": "background:oklch(40.78% 0.1442 352.43);color:#fff;",
  "pink-950": "background:oklch(28.45% 0.1048 353.91);color:#fff;",

  "rose-50": "background:oklch(96.94% 0.0151 12.42);color:#000;",
  "rose-100": "background:oklch(94.14% 0.0297 12.58);color:#000;",
  "rose-200": "background:oklch(89.24% 0.0559 10);color:#000;",
  "rose-300": "background:oklch(80.97% 0.1061 11.64);color:#000;",
  "rose-400": "background:oklch(71.92% 0.169 13.43);color:#fff;",
  "rose-500": "background:oklch(64.5% 0.2154 16.44);color:#fff;",
  "rose-600": "background:oklch(58.58% 0.222 17.58);color:#fff;",
  "rose-700": "background:oklch(51.43% 0.1978 16.93);color:#fff;",
  "rose-800": "background:oklch(45.46% 0.1713 13.7);color:#fff;",
  "rose-900": "background:oklch(41.03% 0.1502 10.27);color:#fff;",
  "rose-950": "background:oklch(27.08% 0.1009 12.09);color:#fff;",

  "gray-50": "background:oklch(98.46% 0.0017 247.84);color:#000;",
  "gray-100": "background:oklch(96.7% 0.0029 264.54);color:#000;",
  "gray-200": "background:oklch(92.76% 0.0058 264.53);color:#000;",
  "gray-300": "background:oklch(87.17% 0.0093 258.34);color:#000;",
  "gray-400": "background:oklch(71.37% 0.0192 261.32);color:#fff;",
  "gray-500": "background:oklch(55.1% 0.0234 264.36);color:#fff;",
  "gray-600": "background:oklch(44.55% 0.0234 264.36);color:#fff;",
  "gray-700": "background:oklch(37.29% 0.0306 259.73);color:#fff;",
  "gray-800": "background:oklch(27.81% 0.0296 256.85);color:#fff;",
  "gray-900": "background:oklch(21.01% 0.0318 264.66);color:#fff;",
  "gray-950": "background:oklch(12.96% 0.0274 261.69);color:#fff;",

  "indigo-50": "background:oklch(96.2% 0.018 272.314);color:#000;",
  "indigo-100": "background:oklch(93% 0.034 272.788);color:#000;",
  "indigo-200": "background:oklch(87% 0.065 274.039);color:#000;",
  "indigo-300": "background:oklch(78.5% 0.115 274.713);color:#000;",
  "indigo-400": "background:oklch(67.3% 0.182 276.935);color:#fff;",
  "indigo-500": "background:oklch(58.5% 0.233 277.117);color:#fff;",
  "indigo-600": "background:oklch(51.1% 0.262 276.966);color:#fff;",
  "indigo-700": "background:oklch(45.7% 0.24 277.023);color:#fff;",
  "indigo-800": "background:oklch(39.8% 0.195 277.366);color:#fff;",
  "indigo-900": "background:oklch(35.9% 0.144 278.697);color:#fff;",
  "indigo-950": "background:oklch(25.7% 0.09 281.288);color:#fff;",

  "fuchsia-50": "background:oklch(97.7% 0.017 320.058);color:#000;",
  "fuchsia-100": "background:oklch(95.2% 0.037 318.852);color:#000;",
  "fuchsia-200": "background:oklch(90.3% 0.076 319.62);color:#000;",
  "fuchsia-300": "background:oklch(83.3% 0.145 321.434);color:#000;",
  "fuchsia-400": "background:oklch(74% 0.238 322.16);color:#fff;",
  "fuchsia-500": "background:oklch(66.7% 0.295 322.15);color:#fff;",
  "fuchsia-600": "background:oklch(59.1% 0.293 322.896);color:#fff;",
  "fuchsia-700": "background:oklch(51.8% 0.253 323.949);color:#fff;",
  "fuchsia-800": "background:oklch(45.2% 0.211 324.591);color:#fff;",
  "fuchsia-900": "background:oklch(40.1% 0.17 325.612);color:#fff;",
  "fuchsia-950": "background:oklch(29.3% 0.136 325.661);color:#fff;",

  "stone-50": "background:oklch(98.5% 0.001 106.423);color:#000;",
  "stone-100": "background:oklch(97% 0.001 106.424);color:#000;",
  "stone-200": "background:oklch(92.3% 0.003 48.717);color:#000;",
  "stone-300": "background:oklch(86.9% 0.005 56.366);color:#000;",
  "stone-400": "background:oklch(70.9% 0.01 56.259);color:#fff;",
  "stone-500": "background:oklch(55.3% 0.013 58.071);color:#fff;",
  "stone-600": "background:oklch(44.4% 0.011 73.639);color:#fff;",
  "stone-700": "background:oklch(37.4% 0.01 67.558);color:#fff;",
  "stone-800": "background:oklch(26.8% 0.007 34.298);color:#fff;",
  "stone-900": "background:oklch(21.6% 0.006 56.043);color:#fff;",
  "stone-950": "background:oklch(14.7% 0.004 49.25);color:#fff;",

  "lime-50": "background:oklch(98.6% 0.031 120.757);color:#000;",
  "lime-100": "background:oklch(96.7% 0.067 122.328);color:#000;",
  "lime-200": "background:oklch(93.8% 0.127 124.321);color:#000;",
  "lime-300": "background:oklch(89.7% 0.196 126.665);color:#000;",
  "lime-400": "background:oklch(84.1% 0.238 128.85);color:#fff;",
  "lime-500": "background:oklch(76.8% 0.233 130.85);color:#fff;",
  "lime-600": "background:oklch(64.8% 0.2 131.684);color:#fff;",
  "lime-700": "background:oklch(53.2% 0.157 131.589);color:#fff;",
  "lime-800": "background:oklch(45.3% 0.124 130.933);color:#fff;",
  "lime-900": "background:oklch(40.5% 0.101 131.063);color:#fff;",
  "lime-950": "background:oklch(27.4% 0.072 132.109);color:#fff;",
};

const csl = (isDebug: boolean, type: string, style: `${StyleColor}-${StyleScale}`, str: string, ...args: any[]) => {
  if (!isDebug) {
    return;
  }

  const _style = logStyles[style] || logStyles["blue-400"];
  console.log(`%c[StableFlowAiSDK]${type ? ".[" + type + "]" : ""} ${str}`, _style, ...args);
};

export class Csl {
  private isDebug: boolean;

  constructor(isDebug: boolean) {
    this.isDebug = isDebug;
  }

  public log(type: string, style: `${StyleColor}-${StyleScale}`, str: string, ...args: any[]) {
    csl(this.isDebug, type, style, str, ...args);
  }

  public info(type: string, str: string, ...args: any[]) {
    csl(this.isDebug, type, "blue-400", str, ...args);
  }

  public error(type: string, str: string, ...args: any[]) {
    csl(this.isDebug, type, "red-400", str, ...args);
  }

  public success(type: string, str: string, ...args: any[]) {
    csl(this.isDebug, type, "green-400", str, ...args);
  }

  public simple(str: string, ...args: any[]) {
    csl(this.isDebug, "", "blue-400", str, ...args);
  }
}
