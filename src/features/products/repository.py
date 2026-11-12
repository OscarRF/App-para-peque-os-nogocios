from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from features.products.models import Product


class ProductRepository:
    """Data access layer for configured catalog products."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, tenant_id: UUID, product_id: UUID) -> Product | None:
        stmt = select(Product).where(
            Product.tenant_id == tenant_id,
            Product.id == product_id,
        )
        return self.db.scalar(stmt)

    def list_products(
        self,
        tenant_id: UUID,
        category_id: UUID | None = None,
        search: str | None = None,
    ) -> list[Product]:
        stmt = select(Product).where(Product.tenant_id == tenant_id)
        if category_id is not None:
            stmt = stmt.where(Product.category_id == category_id)
        if search and search.strip():
            needle = f"%{search.strip().casefold()}%"
            stmt = stmt.where(Product.normalized_name.like(needle))
        stmt = stmt.order_by(Product.created_at.desc(), Product.name.asc())
        return list(self.db.scalars(stmt).all())

    def find_duplicate_in_category(
        self,
        tenant_id: UUID,
        category_id: UUID,
        normalized_name: str,
        exclude_id: UUID | None = None,
    ) -> Product | None:
        stmt = select(Product).where(
            Product.tenant_id == tenant_id,
            Product.category_id == category_id,
            Product.normalized_name == normalized_name,
        )
        if exclude_id is not None:
            stmt = stmt.where(Product.id != exclude_id)
        return self.db.scalar(stmt)

    def exists_for_category(self, tenant_id: UUID, category_id: UUID) -> bool:
        stmt = (
            select(Product.id)
            .where(Product.tenant_id == tenant_id, Product.category_id == category_id)
            .limit(1)
        )
        return self.db.scalar(stmt) is not None

    def exists_any_for_tenant(self, tenant_id: UUID) -> bool:
        stmt = select(Product.id).where(Product.tenant_id == tenant_id).limit(1)
        return self.db.scalar(stmt) is not None

    def create(
        self,
        tenant_id: UUID,
        category_id: UUID,
        name: str,
        normalized_name: str,
        unit_code: str,
        sale_price: Decimal,
    ) -> Product:
        product = Product(
            tenant_id=tenant_id,
            category_id=category_id,
            name=name,
            normalized_name=normalized_name,
            unit_code=unit_code,
            sale_price=sale_price,
            current_stock=Decimal("0.000"),
        )
        self.db.add(product)
        self.db.flush()
        return product
