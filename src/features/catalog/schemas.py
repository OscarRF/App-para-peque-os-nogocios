from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class BusinessTemplateCode(StrEnum):
    """Supported starter business template identifiers."""

    ALMACEN = "almacen"
    BOTILLERIA = "botilleria"
    COMERCIO_GENERAL = "comercio_general"


def _clean_category_name(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("Category name cannot be blank")
    if len(cleaned) > 80:
        raise ValueError("Category name must be at most 80 characters")
    return cleaned


class CategoryCreate(BaseModel):
    """Input payload for creating a category or subcategory at any level."""

    name: str = Field(min_length=1, max_length=80)
    parent_id: UUID | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return _clean_category_name(value)


class CategoryUpdate(BaseModel):
    """Input payload for renaming or relocating a category node."""

    name: str | None = Field(default=None, min_length=1, max_length=80)
    parent_id: UUID | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _clean_category_name(value)


class CategoryNodeResponse(BaseModel):
    """Recursive tree representation of a category and its descendants."""

    id: UUID
    name: str
    parent_id: UUID | None
    level: int = Field(ge=0)
    children: list["CategoryNodeResponse"] = Field(default_factory=list)


CategoryNodeResponse.model_rebuild()


class ApplyTemplateRequest(BaseModel):
    """Request body for applying a starter template."""

    template_code: BusinessTemplateCode


class TemplateSummaryResponse(BaseModel):
    """Summary and preview tree for a business category template."""

    code: BusinessTemplateCode
    title: str
    description: str
    preview_tree: list[dict]


class ApplyTemplateResponse(BaseModel):
    """Result of applying a starter template to a business catalog."""

    template_code: BusinessTemplateCode
    created_count: int
    skipped_count: int
    tree: list[CategoryNodeResponse]


class ClearCatalogResponse(BaseModel):
    """Result of clearing all categories in a tenant catalog."""

    deleted_count: int

