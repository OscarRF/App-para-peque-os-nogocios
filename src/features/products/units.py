from features.products.schemas import StandardUnitCode, UnitKind, UnitOptionResponse

STANDARD_UNITS: tuple[UnitOptionResponse, ...] = (
    UnitOptionResponse(
        code=StandardUnitCode.UNIDAD,
        label="Unidad",
        kind=UnitKind.INTEGER,
        max_decimals=0,
        allows_decimals=False,
    ),
    UnitOptionResponse(
        code=StandardUnitCode.PACK,
        label="Pack / Caja",
        kind=UnitKind.INTEGER,
        max_decimals=0,
        allows_decimals=False,
    ),
    UnitOptionResponse(
        code=StandardUnitCode.KG,
        label="Kilogramo (kg)",
        kind=UnitKind.FRACTIONAL,
        max_decimals=3,
        allows_decimals=True,
    ),
    UnitOptionResponse(
        code=StandardUnitCode.G,
        label="Gramo (g)",
        kind=UnitKind.FRACTIONAL,
        max_decimals=3,
        allows_decimals=True,
    ),
    UnitOptionResponse(
        code=StandardUnitCode.L,
        label="Litro (l)",
        kind=UnitKind.FRACTIONAL,
        max_decimals=3,
        allows_decimals=True,
    ),
    UnitOptionResponse(
        code=StandardUnitCode.ML,
        label="Mililitro (ml)",
        kind=UnitKind.FRACTIONAL,
        max_decimals=3,
        allows_decimals=True,
    ),
)

UNITS_BY_CODE: dict[StandardUnitCode, UnitOptionResponse] = {
    unit.code: unit for unit in STANDARD_UNITS
}
