// Ordinary least squares with a 95% confidence band, for the trend line
// overlaid on the scatter plot. This is a visualization aid, not the
// project's statistical inference (that's the Spearman / partial-Spearman
// correlation from the API) -- so a normal-tail approximation for large
// samples is an acceptable tradeoff against pulling in a stats library on
// the client.

// Two-tailed 95% critical values of the t distribution, df=1..30.
const T_TABLE_95: number[] = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145,
  2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048,
  2.045, 2.042,
];

function tCritical95(df: number): number {
  if (df < 1) return NaN;
  if (df <= 30) return T_TABLE_95[Math.floor(df) - 1];
  return 1.96;
}

export interface RegressionFit {
  n: number;
  slope: number;
  intercept: number;
  predict(x: number): number;
  confidenceBand(x: number): [number, number];
}

/** Fit y = a + b*x by OLS. `xValues`/`yValues` must already be paired and
 * finite (caller filters out nulls/NaNs and, if the x axis is log-scaled,
 * passes log10(x) so the fit and its band are linear in the plotted space). */
export function fitLinearRegression(xValues: number[], yValues: number[]): RegressionFit | null {
  const n = xValues.length;
  if (n < 3) return null;

  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;

  let sXX = 0;
  let sXY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xValues[i] - xMean;
    sXX += dx * dx;
    sXY += dx * (yValues[i] - yMean);
  }
  if (sXX === 0) return null;

  const slope = sXY / sXX;
  const intercept = yMean - slope * xMean;

  let sse = 0;
  for (let i = 0; i < n; i++) {
    const residual = yValues[i] - (intercept + slope * xValues[i]);
    sse += residual * residual;
  }
  const df = n - 2;
  const residualStdErr = df > 0 ? Math.sqrt(sse / df) : 0;
  const tCrit = tCritical95(df);

  return {
    n,
    slope,
    intercept,
    predict: (x: number) => intercept + slope * x,
    confidenceBand: (x: number) => {
      const yHat = intercept + slope * x;
      const se = residualStdErr * Math.sqrt(1 / n + ((x - xMean) ** 2) / sXX);
      const margin = tCrit * se;
      return [yHat - margin, yHat + margin];
    },
  };
}
