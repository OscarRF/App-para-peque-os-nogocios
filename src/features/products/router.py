from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from features.products.schemas import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    UnitOptionResponse,
)
from features.products.service import (
    ProductConflictError,
    ProductNotFoundError,
    ProductService,
)

router = APIRouter(prefix="/api/v1/products", tags=["products"])


def _service(db: Annotated[Session, Depends(get_db)]) -> ProductService:
    return ProductService(db)


ServiceDep = Annotated[ProductService, Depends(_service)]


@router.get("/units", response_model=list[UnitOptionResponse])
def list_units(service: ServiceDep) -> list[UnitOptionResponse]:
    """Return available standard integer and fractional measurement units."""
    return service.list_units()


@router.get("", response_model=list[ProductResponse])
def list_products(
    service: ServiceDep,
    category_id: Annotated[UUID | None, Query()] = None,
    search: Annotated[str | None, Query()] = None,
) -> list[ProductResponse]:
    """List configured products, optionally filtered by category or search term."""
    return service.list_products(category_id=category_id, search=search)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, service: ServiceDep) -> ProductResponse:
    """Create and configure a catalog product with unit and initial sale price."""
    try:
        return service.create_product(payload)
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ProductConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: UUID, service: ServiceDep) -> ProductResponse:
    """Get a single configured product by ID."""
    try:
        return service.get_product(product_id)
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    service: ServiceDep,
) -> ProductResponse:
    """Update product configuration (name, category, measurement unit, or sale price)."""
    try:
        return service.update_product(product_id, payload)
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ProductConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
