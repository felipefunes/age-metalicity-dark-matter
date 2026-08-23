"""Spearman and partial-Spearman correlation for the /correlations endpoint.

A raw Spearman correlation between metallicity and dark-matter fraction
can be spurious if both are actually driven by galaxy mass. The partial
correlation controls for a third variable via rank residualization: rank
all three variables, regress the ranked x and ranked y each on the ranked
control variable (ordinary least squares), and take the Pearson
correlation of the two residual series. This is the standard definition
of a partial Spearman correlation. Significance uses the usual partial-
correlation t-test with degrees of freedom reduced by the number of
control variables.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy import stats


@dataclass(frozen=True)
class CorrelationStats:
    method: str
    coefficient: float
    p_value: float
    n: int


def _drop_nan_rows(*columns: np.ndarray) -> list[np.ndarray]:
    mask = np.ones(len(columns[0]), dtype=bool)
    for col in columns:
        mask &= ~np.isnan(col)
    return [col[mask] for col in columns]


def spearman(x: np.ndarray, y: np.ndarray) -> CorrelationStats:
    x, y = _drop_nan_rows(np.asarray(x, dtype=float), np.asarray(y, dtype=float))
    if len(x) < 3:
        return CorrelationStats(method="spearman", coefficient=float("nan"), p_value=float("nan"), n=len(x))
    rho, p = stats.spearmanr(x, y)
    return CorrelationStats(method="spearman", coefficient=float(rho), p_value=float(p), n=len(x))


def partial_spearman(x: np.ndarray, y: np.ndarray, z: np.ndarray) -> CorrelationStats:
    x, y, z = _drop_nan_rows(
        np.asarray(x, dtype=float), np.asarray(y, dtype=float), np.asarray(z, dtype=float)
    )
    n = len(x)
    if n < 4:
        return CorrelationStats(
            method="partial_spearman", coefficient=float("nan"), p_value=float("nan"), n=n
        )

    rx, ry, rz = stats.rankdata(x), stats.rankdata(y), stats.rankdata(z)

    def residualize(target: np.ndarray, control: np.ndarray) -> np.ndarray:
        slope, intercept, *_ = stats.linregress(control, target)
        return target - (intercept + slope * control)

    resid_x = residualize(rx, rz)
    resid_y = residualize(ry, rz)

    rho, _ = stats.pearsonr(resid_x, resid_y)
    rho = float(rho)

    df = n - 3  # n - 2 - (1 control variable)
    if df <= 0 or abs(rho) >= 1:
        p_value = float("nan")
    else:
        t_stat = rho * np.sqrt(df / (1 - rho**2))
        p_value = float(2 * (1 - stats.t.cdf(abs(t_stat), df)))

    return CorrelationStats(method="partial_spearman", coefficient=rho, p_value=p_value, n=n)
