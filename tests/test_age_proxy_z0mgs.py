import numpy as np
import pytest

from pipeline.external.age_proxy_z0mgs import log_ssfr, propagate_log_ssfr_error


def test_log_ssfr_is_log_sfr_minus_log_mstar():
    assert log_ssfr(log_sfr=0.5, log_mstar=10.0) == pytest.approx(-9.5)


def test_propagate_log_ssfr_error_quadrature():
    assert propagate_log_ssfr_error(e_log_sfr=0.3, e_log_mstar=0.4) == pytest.approx(0.5)  # 3-4-5 triangle


def test_propagate_log_ssfr_error_vectorized():
    result = propagate_log_ssfr_error(np.array([0.3, 0.0]), np.array([0.4, 0.1]))
    assert result[0] == pytest.approx(0.5)
    assert result[1] == pytest.approx(0.1)
