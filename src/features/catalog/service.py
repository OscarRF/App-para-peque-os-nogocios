from collections import defaultdict
from uuid import UUID

from sqlalchemy.orm import Session

from features.catalog.models import Category
from features.catalog.repository import CategoryRepository
from features.catalog.schemas import (
    ApplyTemplateResponse,
    BusinessTemplateCode,
    CategoryCreate,
    CategoryNodeResponse,
    CategoryUpdate,
    ClearCatalogResponse,
    TemplateSummaryResponse,
)
from features.catalog.templates import TEMPLATES
from features.products.repository import ProductRepository

DEFAULT_TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")


class CategoryNotFoundError(Exception):
    """Raised when a referenced category or parent does not exist."""


class CategoryConflictError(Exception):
    """Raised on duplicate sibling name or deleting a non-empty parent."""


class CategoryCycleError(Exception):
    """Raised when moving a category under itself or one of its descendants."""


def normalize_name(name: str) -> str:
    """Normalize category name for case- and whitespace-insensitive sibling uniqueness."""
    return name.strip().casefold()


def _build_subtree(
    children_map: dict[UUID | None, list[Category]],
    parent_id: UUID | None,
    level: int,
) -> list[CategoryNodeResponse]:
    nodes: list[CategoryNodeResponse] = []
    for item in children_map.get(parent_id, []):
        nodes.append(
            CategoryNodeResponse(
                id=item.id,
                name=item.name,
                parent_id=item.parent_id,
                level=level,
                children=_build_subtree(children_map, item.id, level + 1),
            )
        )
    return nodes


def _compute_level(parent_map: dict[UUID, UUID | None], parent_id: UUID | None) -> int:
    level = 0
    cursor = parent_id
    while cursor is not None:
        level += 1
        cursor = parent_map.get(cursor)
    return level


class CategoryService:
    """Business logic for multilevel category management and starter templates."""

    def __init__(self, db: Session, tenant_id: UUID = DEFAULT_TENANT_ID) -> None:
        self.db = db
        self.tenant_id = tenant_id
        self.repo = CategoryRepository(db)

    def list_templates(self) -> list[TemplateSummaryResponse]:
        return [
            TemplateSummaryResponse(
                code=tpl.code,
                title=tpl.title,
                description=tpl.description,
                preview_tree=list(tpl.tree),
            )
            for tpl in TEMPLATES.values()
        ]

    def apply_template(self, template_code: BusinessTemplateCode) -> ApplyTemplateResponse:
        definition = TEMPLATES[template_code]
        created = 0
        skipped = 0

        def walk_and_create(nodes: list[dict] | tuple[dict, ...], parent_id: UUID | None) -> None:
            nonlocal created, skipped
            for entry in nodes:
                raw_name = entry["name"].strip()
                norm = normalize_name(raw_name)
                existing = self.repo.find_sibling_by_normalized_name(
                    self.tenant_id, parent_id, norm
                )
                if existing is None:
                    node = self.repo.create(self.tenant_id, raw_name, norm, parent_id)
                    created += 1
                else:
                    node = existing
                    skipped += 1
                walk_and_create(entry.get("children", []), node.id)

        walk_and_create(definition.tree, None)
        self.db.commit()
        return ApplyTemplateResponse(
            template_code=template_code,
            created_count=created,
            skipped_count=skipped,
            tree=self.get_tree(),
        )

    def get_tree(self) -> list[CategoryNodeResponse]:
        all_nodes = self.repo.list_all(self.tenant_id)
        children_map: dict[UUID | None, list[Category]] = defaultdict(list)
        for node in all_nodes:
            children_map[node.parent_id].append(node)
        return _build_subtree(children_map, None, 0)

    def create_category(self, payload: CategoryCreate) -> CategoryNodeResponse:
        if payload.parent_id is not None:
            parent = self.repo.get_by_id(self.tenant_id, payload.parent_id)
            if parent is None:
                raise CategoryNotFoundError("Parent category not found")

        norm = normalize_name(payload.name)
        duplicate = self.repo.find_sibling_by_normalized_name(
            self.tenant_id, payload.parent_id, norm
        )
        if duplicate is not None:
            raise CategoryConflictError(
                "A category with this name already exists at the same level"
            )

        created = self.repo.create(self.tenant_id, payload.name, norm, payload.parent_id)
        self.db.commit()
        self.db.refresh(created)

        parent_map = {n.id: n.parent_id for n in self.repo.list_all(self.tenant_id)}
        level = _compute_level(parent_map, created.parent_id)
        return CategoryNodeResponse(
            id=created.id,
            name=created.name,
            parent_id=created.parent_id,
            level=level,
            children=[],
        )

    def update_category(self, category_id: UUID, payload: CategoryUpdate) -> CategoryNodeResponse:
        node = self.repo.get_by_id(self.tenant_id, category_id)
        if node is None:
            raise CategoryNotFoundError("Category not found")

        new_name = payload.name if payload.name is not None else node.name
        new_norm = normalize_name(new_name)

        if "parent_id" in payload.model_fields_set:
            new_parent_id = payload.parent_id
        else:
            new_parent_id = node.parent_id

        if new_parent_id is not None:
            if new_parent_id == category_id:
                raise CategoryCycleError("A category cannot be its own parent")
            target_parent = self.repo.get_by_id(self.tenant_id, new_parent_id)
            if target_parent is None:
                raise CategoryNotFoundError("Target parent category not found")

            parent_map = {n.id: n.parent_id for n in self.repo.list_all(self.tenant_id)}
            cursor: UUID | None = new_parent_id
            while cursor is not None:
                if cursor == category_id:
                    raise CategoryCycleError("Cannot move a category under one of its descendants")
                cursor = parent_map.get(cursor)

        duplicate = self.repo.find_sibling_by_normalized_name(
            self.tenant_id, new_parent_id, new_norm, exclude_id=category_id
        )
        if duplicate is not None:
            raise CategoryConflictError(
                "A category with this name already exists at the target level"
            )

        node.name = new_name
        node.normalized_name = new_norm
        node.parent_id = new_parent_id
        self.db.commit()
        self.db.refresh(node)

        all_nodes = self.repo.list_all(self.tenant_id)
        children_map: dict[UUID | None, list[Category]] = defaultdict(list)
        parent_map = {}
        for item in all_nodes:
            children_map[item.parent_id].append(item)
            parent_map[item.id] = item.parent_id

        level = _compute_level(parent_map, node.parent_id)
        return CategoryNodeResponse(
            id=node.id,
            name=node.name,
            parent_id=node.parent_id,
            level=level,
            children=_build_subtree(children_map, node.id, level + 1),
        )

    def delete_category(self, category_id: UUID) -> None:
        node = self.repo.get_by_id(self.tenant_id, category_id)
        if node is None:
            raise CategoryNotFoundError("Category not found")

        if self.repo.has_children(self.tenant_id, category_id):
            raise CategoryConflictError(
                "Cannot delete a category that still has subcategories"
            )

        if ProductRepository(self.db).exists_for_category(self.tenant_id, category_id):
            raise CategoryConflictError(
                "Cannot delete a category that still has associated products"
            )

        self.repo.delete(node)
        self.db.commit()

    def clear_catalog(self) -> ClearCatalogResponse:
        """Delete all categories for the current tenant so a new template can be loaded."""
        if ProductRepository(self.db).exists_any_for_tenant(self.tenant_id):
            raise CategoryConflictError(
                "Cannot clear categories while products are assigned to the catalog"
            )
        deleted_count = self.repo.delete_all_for_tenant(self.tenant_id)
        self.db.commit()
        return ClearCatalogResponse(deleted_count=deleted_count)
