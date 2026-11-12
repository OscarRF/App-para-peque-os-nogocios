from uuid import UUID

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from features.catalog.models import Category


class CategoryRepository:
    """Data access layer for category tree persistence."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, tenant_id: UUID, category_id: UUID) -> Category | None:
        stmt = select(Category).where(
            Category.tenant_id == tenant_id,
            Category.id == category_id,
        )
        return self.db.scalar(stmt)

    def list_all(self, tenant_id: UUID) -> list[Category]:
        stmt = (
            select(Category)
            .where(Category.tenant_id == tenant_id)
            .order_by(Category.created_at.asc(), Category.name.asc())
        )
        return list(self.db.scalars(stmt).all())

    def find_sibling_by_normalized_name(
        self,
        tenant_id: UUID,
        parent_id: UUID | None,
        normalized_name: str,
        exclude_id: UUID | None = None,
    ) -> Category | None:
        parent_filter = (
            Category.parent_id.is_(None)
            if parent_id is None
            else Category.parent_id == parent_id
        )
        stmt = select(Category).where(
            Category.tenant_id == tenant_id,
            parent_filter,
            Category.normalized_name == normalized_name,
        )
        if exclude_id is not None:
            stmt = stmt.where(Category.id != exclude_id)
        return self.db.scalar(stmt)

    def has_children(self, tenant_id: UUID, category_id: UUID) -> bool:
        stmt = (
            select(Category.id)
            .where(Category.tenant_id == tenant_id, Category.parent_id == category_id)
            .limit(1)
        )
        return self.db.scalar(stmt) is not None

    def create(
        self,
        tenant_id: UUID,
        name: str,
        normalized_name: str,
        parent_id: UUID | None,
    ) -> Category:
        node = Category(
            tenant_id=tenant_id,
            name=name,
            normalized_name=normalized_name,
            parent_id=parent_id,
        )
        self.db.add(node)
        self.db.flush()
        return node

    def delete(self, node: Category) -> None:
        self.db.delete(node)
        self.db.flush()

    def delete_all_for_tenant(self, tenant_id: UUID) -> int:
        # Clear self-referential parent_id first to satisfy ondelete="RESTRICT".
        self.db.execute(
            update(Category)
            .where(Category.tenant_id == tenant_id)
            .values(parent_id=None)
        )
        result = self.db.execute(
            delete(Category).where(Category.tenant_id == tenant_id)
        )
        self.db.flush()
        return int(result.rowcount or 0)
