export const isDebugEnabled = () => process.env.APP_DEBUG === "true";

export const debugLog = (...args: unknown[]) => {
  if (isDebugEnabled()) {
    console.log(...args);
  }
};

export const debugError = (...args: unknown[]) => {
  if (isDebugEnabled()) {
    console.error(...args);
  }
};
