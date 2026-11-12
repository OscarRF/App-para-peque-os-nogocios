"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import {
  getGetCategoryTreeApiV1CategoriesTreeGetQueryKey,
  useClearCatalogApiV1CategoriesDelete,
  useCreateCategoryApiV1CategoriesPost,
  useDeleteCategoryApiV1CategoriesCategoryIdDelete,
  useGetCategoryTreeApiV1CategoriesTreeGet,
  useUpdateCategoryApiV1CategoriesCategoryIdPatch,
} from "@/api/generated/endpoints/categories/categories";
import type { CategoryNodeResponse } from "@/api/generated/model";
import { ApiError } from "@/lib/api-client";

import {
  filterTree,
  findNodeById,
  flattenParentOptions,
  getBreadcrumb,
  getDescendantIds,
} from "../tree-utils";

type SidePanelMode =
  | { kind: "idle" }
  | { kind: "create"; parentId: string | null }
  | { kind: "edit"; categoryId: string }
  | { kind: "delete-blocked"; categoryName: string; childNames: string[]; detail: string };

interface CategoryTreeManagerProps {
  onGoToTemplates: () => void;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
}

function getLevelBadgeClass(level: number): string {
  if (level === 0) return "level-badge-teal";
  if (level === 1) return "level-badge-green";
  return "level-badge-coral";
}

export function CategoryTreeManager({
  onGoToTemplates,
  searchTerm: controlledSearchTerm,
  onSearchTermChange,
}: CategoryTreeManagerProps) {
  const queryClient = useQueryClient();
  const treeQuery = useGetCategoryTreeApiV1CategoriesTreeGet();
  const createMutation = useCreateCategoryApiV1CategoriesPost();
  const updateMutation = useUpdateCategoryApiV1CategoriesCategoryIdPatch();
  const deleteMutation = useDeleteCategoryApiV1CategoriesCategoryIdDelete();
  const clearMutation = useClearCatalogApiV1CategoriesDelete();

  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const searchTerm = controlledSearchTerm ?? internalSearchTerm;
  const setSearchTerm = onSearchTermChange ?? setInternalSearchTerm;

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [panelMode, setPanelMode] = useState<SidePanelMode>({ kind: "idle" });
  const [nameInput, setNameInput] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const tree: CategoryNodeResponse[] = useMemo(
    () => treeQuery.data?.data ?? [],
    [treeQuery.data],
  );
  const visibleTree = useMemo(() => filterTree(tree, searchTerm), [tree, searchTerm]);

  const editingNode = useMemo(() => {
    if (panelMode.kind !== "edit") return null;
    return findNodeById(tree, panelMode.categoryId);
  }, [panelMode, tree]);

  const parentOptions = useMemo(() => {
    if (panelMode.kind !== "edit" || !editingNode) return [];
    const excluded = getDescendantIds(editingNode);
    return flattenParentOptions(tree, excluded);
  }, [editingNode, panelMode.kind, tree]);

  const createBreadcrumb = useMemo(() => {
    if (panelMode.kind !== "create" || !panelMode.parentId) return null;
    return getBreadcrumb(tree, panelMode.parentId)?.join(" > ") ?? null;
  }, [panelMode, tree]);

  async function refreshTree() {
    await queryClient.invalidateQueries({
      queryKey: getGetCategoryTreeApiV1CategoriesTreeGetQueryKey(),
    });
  }

  async function handleConfirmClear() {
    setClearError(null);
    try {
      await clearMutation.mutateAsync();
      await refreshTree();
      setPanelMode({ kind: "idle" });
      setSearchTerm("");
      setCollapsedIds(new Set());
      setIsClearModalOpen(false);
      onGoToTemplates();
    } catch (error) {
      if (error instanceof ApiError) {
        setClearError(error.detail);
      } else {
        setClearError("No se pudieron eliminar las categorías.");
      }
    }
  }

  function openCreate(parentId: string | null) {
    setPanelMode({ kind: "create", parentId });
    setNameInput("");
    setFormError(null);
    setFeedback(null);
  }

  function openEdit(node: CategoryNodeResponse) {
    setPanelMode({ kind: "edit", categoryId: node.id });
    setNameInput(node.name);
    setSelectedParentId(node.parent_id ?? "");
    setFormError(null);
    setFeedback(null);
  }

  function toggleCollapse(id: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleCreateSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (panelMode.kind !== "create") return;
    const cleaned = nameInput.trim();
    if (!cleaned) {
      setFormError("El nombre es obligatorio.");
      return;
    }

    setFormError(null);
    try {
      const response = await createMutation.mutateAsync({
        data: { name: cleaned, parent_id: panelMode.parentId },
      });
      await refreshTree();
      if (response.status === 201) {
        setFeedback(`Categoría "${response.data.name}" creada correctamente.`);
        setNameInput("");
        setPanelMode({ kind: "idle" });
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail : "No se pudo crear la categoría.");
    }
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (panelMode.kind !== "edit") return;
    const cleaned = nameInput.trim();
    if (!cleaned) {
      setFormError("El nombre es obligatorio.");
      return;
    }

    setFormError(null);
    try {
      const response = await updateMutation.mutateAsync({
        categoryId: panelMode.categoryId,
        data: {
          name: cleaned,
          parent_id: selectedParentId === "" ? null : selectedParentId,
        },
      });
      await refreshTree();
      if (response.status === 200) {
        setFeedback(`Categoría "${response.data.name}" actualizada correctamente.`);
        setPanelMode({ kind: "idle" });
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail : "No se pudo actualizar la categoría.");
    }
  }

  async function handleDelete(node: CategoryNodeResponse) {
    setFormError(null);
    setFeedback(null);
    try {
      await deleteMutation.mutateAsync({ categoryId: node.id });
      await refreshTree();
      setFeedback(`Categoría "${node.name}" eliminada.`);
      if (panelMode.kind === "edit" && panelMode.categoryId === node.id) {
        setPanelMode({ kind: "idle" });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setPanelMode({
          kind: "delete-blocked",
          categoryName: node.name,
          childNames: (node.children ?? []).map((child) => child.name),
          detail: err.detail,
        });
        return;
      }
      setFormError(err instanceof ApiError ? err.detail : "No se pudo eliminar la categoría.");
    }
  }

  function renderTreeRows(nodes: CategoryNodeResponse[]) {
    return nodes.map((node) => {
      const hasChildren = (node.children ?? []).length > 0;
      const isCollapsed = collapsedIds.has(node.id) && searchTerm.trim() === "";
      const isActive =
        (panelMode.kind === "edit" && panelMode.categoryId === node.id) ||
        (panelMode.kind === "create" && panelMode.parentId === node.id);

      return (
        <div key={node.id}>
          <div
            className={`tree-row ${isActive ? "active-row" : ""}`}
            style={{ paddingLeft: `${12 + node.level * 22}px` }}
          >
            <div className="row-left">
              {hasChildren ? (
                <button
                  type="button"
                  className="toggle-btn"
                  aria-label={isCollapsed ? `Expandir ${node.name}` : `Colapsar ${node.name}`}
                  onClick={() => toggleCollapse(node.id)}
                >
                  {isCollapsed ? "▸" : "▾"}
                </button>
              ) : (
                <span className="toggle-btn leaf-dot" aria-hidden="true">
                  •
                </span>
              )}
              <span
                className="node-name"
                style={{ fontWeight: node.level === 0 ? 700 : node.level === 1 ? 600 : 400 }}
              >
                {node.name}
              </span>
              <span className={`level-pill ${getLevelBadgeClass(node.level)}`}>
                Nivel {node.level + 1}
              </span>
            </div>

            <div className="row-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => openCreate(node.id)}
              >
                + Subcategoría
              </button>
              <button type="button" className="icon-btn" onClick={() => openEdit(node)}>
                Editar
              </button>
              <button
                type="button"
                className={`icon-btn ${hasChildren ? "blocked" : "allowed"}`}
                onClick={() => handleDelete(node)}
              >
                Eliminar
              </button>
            </div>
          </div>

          {hasChildren && !isCollapsed && renderTreeRows(node.children ?? [])}
        </div>
      );
    });
  }

  if (treeQuery.isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="empty-state">Cargando árbol de categorías...</div>
        </div>
      </div>
    );
  }

  if (treeQuery.isError) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert-box alert-danger" style={{ marginTop: 0 }}>
            Error al cargar el catálogo desde la API. Verifica que el backend esté activo.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="split-layout">
        <div className="card">
          <div className="card-header">
            <div>
              <h5>Árbol de Categorías Multinivel</h5>
              <div className="card-header-sub">
                Expande ramas, filtra por nombre o agrega subcategorías en cualquier nivel.
              </div>
            </div>
            <div className="card-header-actions">
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => {
                  setClearError(null);
                  setIsClearModalOpen(true);
                }}
                disabled={tree.length === 0 || clearMutation.isPending}
              >
                Limpiar categorías
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openCreate(null)}
              >
                + Nueva categoría principal
              </button>
            </div>
          </div>

        <div className="card-body">
          <div className="toolbar">
            <input
              className="search-input"
              type="text"
              placeholder="Buscar categoría o subcategoría..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="tree-table-head" aria-hidden="true">
            <span>Categoría / Jerarquía</span>
            <span>Acciones</span>
          </div>

          <div className="tree-panel">
            {visibleTree.length === 0 ? (
              <div className="empty-state">
                {tree.length === 0 ? (
                  <>
                    <p style={{ marginBottom: "12px" }}>
                      Aún no tienes categorías en tu catálogo.
                    </p>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onGoToTemplates}
                      >
                        Cargar plantilla por giro
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openCreate(null)}
                      >
                        Crear categoría manualmente
                      </button>
                    </div>
                  </>
                ) : (
                  <p>No se encontraron categorías para &ldquo;{searchTerm}&rdquo;.</p>
                )}
              </div>
            ) : (
              renderTreeRows(visibleTree)
            )}
          </div>
        </div>
      </div>

      <div className="card side-card">
        <div className="card-header">
          <h5>Detalle y Acciones</h5>
        </div>

        <div className="card-body">
          {panelMode.kind === "idle" && (
            <div>
              <h2>Panel de Categorías</h2>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "10px" }}>
                Crea categorías principales o agrega subcategorías en cualquier nivel desde los
                botones de la tabla.
              </p>
              {feedback && <div className="alert-box alert-success">{feedback}</div>}
              {formError && <div className="alert-box alert-danger">{formError}</div>}
            </div>
          )}

          {panelMode.kind === "create" && (
            <form onSubmit={handleCreateSubmit}>
              <h2>{panelMode.parentId ? "+ Nueva Subcategoría" : "+ Nueva Categoría Principal"}</h2>
              {createBreadcrumb && (
                <div className="form-group">
                  <label>Se creará dentro de la ruta:</label>
                  <div className="path-chip">{createBreadcrumb}</div>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="category-name-input">Nombre</label>
                <input
                  id="category-name-input"
                  className={`form-control ${formError ? "error-input" : ""}`}
                  type="text"
                  maxLength={80}
                  placeholder="Ej. Porotos y Lentejas"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                />
              </div>

              {formError && <div className="alert-box alert-danger">{formError}</div>}

              <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPanelMode({ kind: "idle" })}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {panelMode.kind === "edit" && (
            <form onSubmit={handleEditSubmit}>
              <h2>Editar / Reasignar Categoría</h2>
              <div className="form-group">
                <label htmlFor="edit-category-name">Nombre</label>
                <input
                  id="edit-category-name"
                  className={`form-control ${formError ? "error-input" : ""}`}
                  type="text"
                  maxLength={80}
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-category-parent">Categoría padre</label>
                <select
                  id="edit-category-parent"
                  className="form-control"
                  value={selectedParentId}
                  onChange={(event) => setSelectedParentId(event.target.value)}
                >
                  <option value="">Categoría Principal (Raíz)</option>
                  {parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.pathLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="alert-box alert-warning">
                <strong>Protección anti-ciclos:</strong> No permite elegir como padre a la misma
                categoría ni a sus propias subcategorías.
              </div>

              {formError && <div className="alert-box alert-danger">{formError}</div>}

              <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPanelMode({ kind: "idle" })}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {panelMode.kind === "delete-blocked" && (
            <div>
              <h2 style={{ color: "#9e1c2e" }}>
                No se puede eliminar &ldquo;{panelMode.categoryName}&rdquo;
              </h2>
              {panelMode.childNames.length > 0 ? (
                <>
                  <p style={{ fontSize: "13px", color: "#505458", marginBottom: "10px" }}>
                    Esta categoría todavía contiene subcategorías activas (
                    <strong>{panelMode.childNames.join(", ")}</strong>).
                  </p>
                  <div className="alert-box alert-danger">
                    <strong>Qué debes hacer para borrarla:</strong>
                    <br />
                    1. Mueve o reasigna sus subcategorías a otra rama, o
                    <br />
                    2. Elimina primero las subcategorías hoja vacías.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: "13px", color: "#505458", marginBottom: "10px" }}>
                    Esta categoría tiene productos asociados y no puede eliminarse mientras existan
                    registros vinculados.
                  </p>
                  <div className="alert-box alert-danger">
                    {panelMode.detail}
                  </div>
                </>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setPanelMode({ kind: "idle" })}
                >
                  Entendido
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {isClearModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-catalog-dialog-title"
          >
            <h5 id="clear-catalog-dialog-title" className="modal-title">
              Limpiar catálogo de categorías
            </h5>
            <p className="modal-body-text">
              ¿Desea eliminar todas las categorías y cargar uno nuevo?
            </p>
            {clearError && <div className="alert-box alert-danger">{clearError}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsClearModalOpen(false)}
                disabled={clearMutation.isPending}
              >
                No
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmClear}
                disabled={clearMutation.isPending}
              >
                {clearMutation.isPending ? "Eliminando..." : "Sí"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
