import pytest

from pipeline.external.pilyugin import CHARACTERISTIC_RADIUS, characteristic_abundance


def test_characteristic_abundance_known_case():
    # Real row from J/AJ/147/131/galaxies: NGC 0300, [O/H]=8.51, C[O/H]1=-0.519
    value = characteristic_abundance(oh_center=8.51, gradient_per_r25=-0.519)
    assert value == pytest.approx(8.51 + 0.4 * -0.519, abs=1e-9)
    assert value == pytest.approx(8.302, abs=1e-3)


def test_characteristic_abundance_flat_gradient_unchanged():
    assert characteristic_abundance(oh_center=8.6, gradient_per_r25=0.0) == pytest.approx(8.6)


def test_characteristic_radius_is_the_documented_convention():
    assert CHARACTERISTIC_RADIUS == 0.4
