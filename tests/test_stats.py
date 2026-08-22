import numpy as np
import pytest
from scipy import stats as scipy_stats

from api.stats import partial_spearman, spearman


def test_spearman_perfect_monotonic():
    x = np.arange(10, dtype=float)
    y = x**3  # monotonic but nonlinear -> Spearman still +1
    result = spearman(x, y)
    assert result.coefficient == pytest.approx(1.0)
    assert result.n == 10


def test_spearman_drops_nan_rows():
    x = np.array([1.0, 2.0, np.nan, 4.0, 5.0])
    y = np.array([1.0, 2.0, 3.0, np.nan, 5.0])
    result = spearman(x, y)
    assert result.n == 3  # indices 0, 1, 4 survive; 2 and 3 each have a NaN


def test_spearman_too_few_points_returns_nan_not_crash():
    result = spearman(np.array([1.0, 2.0]), np.array([2.0, 1.0]))
    assert np.isnan(result.coefficient)
    assert result.n == 2


def test_partial_spearman_removes_confound_driven_by_shared_variable():
    """x and y are each z plus independent noise: raw correlation is driven
    mostly by their shared dependence on z (the scenario this project cares
    about -- e.g. metallicity and f_DM both tracking mass). Once z is
    partialled out, the residual correlation should drop sharply.
    """
    rng = np.random.default_rng(0)
    n = 200
    z = np.linspace(1, 50, n)
    noise_x = rng.normal(0, 6, size=n)
    noise_y = rng.normal(0, 6, size=n)
    x = z + noise_x
    y = z + noise_y

    raw = spearman(x, y)
    partial = partial_spearman(x, y, z)

    assert raw.coefficient > 0.5
    assert abs(partial.coefficient) < 0.2
    assert partial.n == n


def test_partial_spearman_preserves_a_genuine_direct_relationship():
    """If x and y are directly related independent of z, partialling out z
    should NOT erase that relationship."""
    rng = np.random.default_rng(1)
    n = 200
    z = rng.normal(0, 1, size=n)  # unrelated to x and y
    x = rng.normal(0, 1, size=n)
    y = x * 2 + rng.normal(0, 0.1, size=n)

    partial = partial_spearman(x, y, z)
    assert partial.coefficient > 0.9


def test_partial_spearman_matches_manual_rank_residual_pearson():
    rng = np.random.default_rng(2)
    n = 30
    x = rng.normal(size=n)
    y = rng.normal(size=n)
    z = rng.normal(size=n)

    rx, ry, rz = scipy_stats.rankdata(x), scipy_stats.rankdata(y), scipy_stats.rankdata(z)
    fit_x, fit_y = scipy_stats.linregress(rz, rx), scipy_stats.linregress(rz, ry)
    resid_x = rx - (fit_x.intercept + fit_x.slope * rz)
    resid_y = ry - (fit_y.intercept + fit_y.slope * rz)
    expected_rho, _ = scipy_stats.pearsonr(resid_x, resid_y)

    result = partial_spearman(x, y, z)
    assert result.coefficient == pytest.approx(expected_rho, rel=1e-9)
