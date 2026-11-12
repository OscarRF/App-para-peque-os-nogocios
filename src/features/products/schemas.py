from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class UnitKind(StrEnum):
    """Classification of how a product quantity is measured."""

    INTEGER = "integer"
    FRACTIONAL = "fractional"


class StandardUnitCode(StrEnum):
    """Supported standard measurement unit codes."""

    UNIDAD = "unidad"
    PACK = "pack"
    KG = "kg"
    G = "g"
    L = "l"
    ML = "ml"


def _normalize_stripped_name(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("Product name cannot be empty or whitespace")
    return cleaned


class UnitOptionResponse(BaseModel):
    """Standard unit option with precision rules."""

    code: StandardUnitCode
    label: str
    kind: UnitKind
    max_decimals: int = Field(ge=0, le=3)
    allows_decimals: bool


class ProductCreate(BaseModel):
    """Payload to create and configure a catalog product."""

    name: str = Field(min_length=1, max_length=120)
    category_id: UUID
    unit_code: StandardUnitCode
    sale_price: Decimal = Field(gt=Decimal("0"), max_digits=12, decimal_places=2)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return _normalize_stripped_name(value)


class ProductUpdate(BaseModel):
    """Payload to update a configured product."""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    category_id: UUID | None = None
    unit_code: StandardUnitCode | None = None
    sale_price: Decimal | None = Field(
        default=None, gt=Decimal("0"), max_digits=12, decimal_places=2
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_stripped_name(value)


class ProductResponse(BaseModel):
    """Product representation returned by the API."""

    id: UUID
    name: str
    category_id: UUID
    category_path: str
    unit_code: StandardUnitCode
    unit_kind: UnitKind
    max_decimals: int
    allows_decimals: bool
    sale_price: Decimal
    current_stock: Decimal
