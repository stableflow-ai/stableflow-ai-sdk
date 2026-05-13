import { Csl, type StyleColor, type StyleScale } from "./log";

export class ExecTime {
  private isDebug: boolean;
  private type: string;
  private logStyle: `${StyleColor}-${StyleScale}`;
  private startTimestamp: number = 0;
  private currentTimestamp: number = 0;
  private isPerformance: boolean;
  private readonly performanceThreshold: number = 1000;
  private csl: Csl;

  constructor(options: { type: string; logStyle?: `${StyleColor}-${StyleScale}`; isPerformance?: boolean; isDebug: boolean; }) {
    const { type, logStyle, isPerformance, isDebug } = options;
    this.type = type;
    this.logStyle = logStyle ?? "stone-500";
    this.isPerformance = isPerformance ?? false;
    this.isDebug = isDebug;
    this.csl = new Csl(isDebug);

    if (!isDebug) return;

    this.startTimestamp = performance.now();
    this.currentTimestamp = this.startTimestamp;
  }

  public breakpoint() {
    if (!this.isDebug) return;
    this.currentTimestamp = performance.now();
  }

  public log(subType: string, str?: string, ...params: any[]) {
    const duration = performance.now() - this.currentTimestamp;
    if (this.isPerformance) {
      if (duration <= this.performanceThreshold) {
        return;
      }
    }
    this.csl.log(this.type, this.logStyle, `<${subType}>cost: %c%sms%c${str ? ", " + str : ""}`, "color:red;font-weight:bold;", duration.toFixed(0), "color:black;font-weight:normal;", ...params);
  }

  public logTotal(subType: string, str?: string, ...params: any[]) {
    const duration = performance.now() - this.startTimestamp;
    this.csl.log(this.type, this.logStyle, `<${subType}>total cost: %c%sms%c${str ? ", " + str : ""}`, "color:red;font-weight:bold;", duration.toFixed(0), "color:black;font-weight:normal;", ...params);
  }

}
