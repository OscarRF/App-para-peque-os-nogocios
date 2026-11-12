from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from core.database import get_db
from features.catalog.schemas import (
    ApplyTemplateRequest,
    ApplyTemplateResponse,
    CategoryCreate,
    CategoryNodeResponse,
    CategoryUpdate,
    ClearCatalogResponse,
    TemplateSummaryResponse,
)
from features.catalog.service import (
    CategoryConflictError,
    CategoryCycleError,
    CategoryNotFoundError,
    CategoryService,
)

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


def _service(db: Annotated[Session, Depends(get_db)]) -> CategoryService:
    return CategoryService(db)


ServiceDep = Annotated[CategoryService, Depends(_service)]


@router.get("/templates", response_model=list[TemplateSummaryResponse])
def list_templates(service: ServiceDep) -> list[TemplateSummaryResponse]:
    """List available starter business category templates."""
    return service.list_templates()


@router.post("/templates/apply", response_model=ApplyTemplateResponse)
def apply_template(
    payload: ApplyTemplateRequest,
    service: ServiceDep,
) -> ApplyTemplateResponse:
    """Apply a starter business template idempotently to the catalog."""
    return service.apply_template(payload.template_code)


@router.get("/tree", response_model=list[CategoryNodeResponse])
def get_category_tree(service: ServiceDep) -> list[CategoryNodeResponse]:
    """Return the full nested category tree."""
    return service.get_tree()


@router.post("", response_model=CategoryNodeResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    service: ServiceDep,
) -> CategoryNodeResponse:
    """Create a root category or nested subcategory at any level."""
    try:
        return service.create_category(payload)
    except CategoryNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except CategoryConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.patch("/{category_id}", response_model=CategoryNodeResponse)
def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    service: ServiceDep,
) -> CategoryNodeResponse:
    """Rename or move a category node while preventing cycles and duplicates."""
    try:
        return service.update_category(category_id, payload)
    except CategoryNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except CategoryConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except CategoryCycleError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc


@router.delete("", response_model=ClearCatalogResponse)
def clear_catalog(service: ServiceDep) -> ClearCatalogResponse:
    """Delete all categories for the active tenant."""
    try:
        return service.clear_catalog()
    except CategoryConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: UUID,
    service: ServiceDep,
) -> Response:
    """Delete a leaf category that has no subcategories."""
    try:
        service.delete_category(category_id)
    except CategoryNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except CategoryConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
