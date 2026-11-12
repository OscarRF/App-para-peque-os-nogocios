from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from features.catalog.models import Category
from features.catalog.repository import CategoryRepository
from features.catalog.service import DEFAULT_TENANT_ID
from features.products.models import Product
from features.products.repository import ProductRepository
from features.products.schemas import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    StandardUnitCode,
    UnitOptionResponse,
)
from features.products.units import STANDARD_UNITS, UNITS_BY_CODE


class ProductNotFoundError(Exception):
    """Raised when a requested product or category does not exist."""


class ProductConflictError(Exception):
    """Raised when a product name conflicts with an existing item in the same category."""


def _build_category_paths(categories: list[Category]) -> dict[UUID, str]:
    by_id = {cat.id: cat for cat in categories}
    cache: dict[UUID, str] = {}

    def resolve(cat_id: UUID) -> str:
        if cat_id in cache:
            return cache[cat_id]
        parts: list[str] = []
        current_id: UUID | None = cat_id
        visited: set[UUID] = set()
        while current_id is not None and current_id not in visited:
            visited.add(current_id)
            node = by_id.get(current_id)
            if node is None:
                break
            parts.append(node.name)
            current_id = node.parent_id
        path = " > ".join(reversed(parts))
        cache[cat_id] = path
        return path

    for cat_id in by_id:
        resolve(cat_id)
    return cache


class ProductService:
    """Business logic for configuring products, measurement units, and initial prices."""

    def __init__(self, db: Session, tenant_id: UUID = DEFAULT_TENANT_ID) -> None:
        self.db = db
        self.tenant_id = tenant_id
        self.repo = ProductRepository(db)
        self.category_repo = CategoryRepository(db)

    def list_units(self) -> list[UnitOptionResponse]:
        return list(STANDARD_UNITS)

    def list_products(
        self,
        category_id: UUID | None = None,
        search: str | None = None,
    ) -> list[ProductResponse]:
        products = self.repo.list_products(self.tenant_id, category_id=category_id, search=search)
        paths = _build_category_paths(self.category_repo.list_all(self.tenant_id))
        return [self._to_response(product, paths) for product in products]

    def get_product(self, product_id: UUID) -> ProductResponse:
        product = self.repo.get_by_id(self.tenant_id, product_id)
        if product is None:
            raise ProductNotFoundError("Product not found")
        paths = _build_category_paths(self.category_repo.list_all(self.tenant_id))
        return self._to_response(product, paths)

    def create_product(self, payload: ProductCreate) -> ProductResponse:
        category = self.category_repo.get_by_id(self.tenant_id, payload.category_id)
        if category is None:
            raise ProductNotFoundError("Category not found")

        clean_name = payload.name.strip()
        normalized = clean_name.casefold()
        if self.repo.find_duplicate_in_category(self.tenant_id, payload.category_id, normalized):
            raise ProductConflictError(
                f"Product '{clean_name}' already exists in this category"
            )

        product = self.repo.create(
            tenant_id=self.tenant_id,
            category_id=payload.category_id,
            name=clean_name,
            normalized_name=normalized,
            unit_code=payload.unit_code.value,
            sale_price=Decimal(payload.sale_price),
        )
        self.db.commit()
        self.db.refresh(product)
        paths = _build_category_paths(self.category_repo.list_all(self.tenant_id))
        return self._to_response(product, paths)

    def update_product(self, product_id: UUID, payload: ProductUpdate) -> ProductResponse:
        product = self.repo.get_by_id(self.tenant_id, product_id)
        if product is None:
            raise ProductNotFoundError("Product not found")

        target_category_id = (
            payload.category_id
            if "category_id" in payload.model_fields_set and payload.category_id is not None
            else product.category_id
        )
        if target_category_id != product.category_id:
            if self.category_repo.get_by_id(self.tenant_id, target_category_id) is None:
                raise ProductNotFoundError("Category not found")

        target_name = (
            payload.name.strip()
            if "name" in payload.model_fields_set and payload.name is not None
            else product.name
        )
        normalized = target_name.casefold()
        if self.repo.find_duplicate_in_category(
            self.tenant_id,
            target_category_id,
            normalized,
            exclude_id=product.id,
        ):
            raise ProductConflictError(
                f"Product '{target_name}' already exists in this category"
            )

        product.name = target_name
        product.normalized_name = normalized
        product.category_id = target_category_id
        if "unit_code" in payload.model_fields_set and payload.unit_code is not None:
            product.unit_code = payload.unit_code.value
        if "sale_price" in payload.model_fields_set and payload.sale_price is not None:
            product.sale_price = Decimal(payload.sale_price)

        self.db.commit()
        self.db.refresh(product)
        paths = _build_category_paths(self.category_repo.list_all(self.tenant_id))
        return self._to_response(product, paths)

    @staticmethod
    def _to_response(product: Product, category_paths: dict[UUID, str]) -> ProductResponse:
        unit_code = StandardUnitCode(product.unit_code)
        unit_meta = UNITS_BY_CODE[unit_code]
        return ProductResponse(
            id=product.id,
            name=product.name,
            category_id=product.category_id,
            category_path=category_paths.get(product.category_id, ""),
            unit_code=unit_code,
            unit_kind=unit_meta.kind,
            max_decimals=unit_meta.max_decimals,
            allows_decimals=unit_meta.allows_decimals,
            sale_price=Decimal(product.sale_price),
            current_stock=Decimal(product.current_stock),
        )
