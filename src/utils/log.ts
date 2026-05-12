export const csl = (isDebug: boolean, type: 0 | 1 | 2, str: string, ...args: any[]) => {
  if (!isDebug) {
    return;
  }

  let bg = "#6284F5";
  if (type === 1) {
    bg = "#FF6B35";
  }
  if (type === 2) {
    bg = "#4DCF5E";
  }

  console.log(`%c[StableFlowAISDK] %c${str}`, `background:${bg};color:#ffffff;`, "background:#F5F7FD;color:#000000;", ...args);
};

export const cslInfo = (isDebug: boolean, str: string, ...args: any[]) => {
  csl(isDebug, 0, str, ...args);
};

export const cslError = (isDebug: boolean, str: string, ...args: any[]) => {
  csl(isDebug, 1, str, ...args);
};

export const cslSuccess = (isDebug: boolean, str: string, ...args: any[]) => {
  csl(isDebug, 2, str, ...args);
};
