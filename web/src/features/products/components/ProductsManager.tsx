"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useGetCategoryTreeApiV1CategoriesTreeGet } from "@/api/generated/endpoints/categories/categories";
import {
  getListProductsApiV1ProductsGetQueryKey,
  useCreateProductApiV1ProductsPost,
  useListProductsApiV1ProductsGet,
  useListUnitsApiV1ProductsUnitsGet,
  useUpdateProductApiV1ProductsProductIdPatch,
} from "@/api/generated/endpoints/products/products";
import {
  StandardUnitCode,
  type ProductResponse,
  type UnitOptionResponse,
} from "@/api/generated/model";
import { flattenParentOptions } from "@/features/catalog/tree-utils";
import { ApiError } from "@/lib/api-client";

type PanelMode =
  | { kind: "idle" }
  | { kind: "create" }
  | { kind: "edit"; productId: string };

interface ProductsManagerProps {
  onGoToCategories: () => void;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
}

function formatCurrency(value: string): string {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return `$${value}`;
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 2,
  }).format(parsed);
}

function formatStock(value: string, allowsDecimals: boolean): string {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  return allowsDecimals ? parsed.toFixed(3) : String(Math.trunc(parsed));
}

export function ProductsManager({
  onGoToCategories,
  searchTerm: controlledSearchTerm,
  onSearchTermChange,
}: ProductsManagerProps) {
  const queryClient = useQueryClient();
  const unitsQuery = useListUnitsApiV1ProductsUnitsGet();
  const productsQuery = useListProductsApiV1ProductsGet();
  const treeQuery = useGetCategoryTreeApiV1CategoriesTreeGet();
  const createMutation = useCreateProductApiV1ProductsPost();
  const updateMutation = useUpdateProductApiV1ProductsProductIdPatch();

  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const searchTerm = controlledSearchTerm ?? internalSearchTerm;
  const setSearchTerm = onSearchTermChange ?? setInternalSearchTerm;
  const [categoryFilter, setCategoryFilter] = useState("");

  const [panelMode, setPanelMode] = useState<PanelMode>({ kind: "idle" });
  const [nameInput, setNameInput] = useState("");
  const [categoryIdInput, setCategoryIdInput] = useState("");
  const [unitCodeInput, setUnitCodeInput] = useState<StandardUnitCode>(
    StandardUnitCode.unidad,
  );
  const [salePriceInput, setSalePriceInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const units: UnitOptionResponse[] = unitsQuery.data?.data ?? [];
  const products: ProductResponse[] = useMemo(
    () => (productsQuery.data?.status === 200 ? productsQuery.data.data : []),
    [productsQuery.data],
  );
  const tree = useMemo(() => treeQuery.data?.data ?? [], [treeQuery.data]);
  const categoryOptions = useMemo(() => flattenParentOptions(tree, new Set()), [tree]);

  const visibleProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((item) => {
      if (categoryFilter && item.category_id !== categoryFilter) {
        return false;
      }
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.category_path.toLowerCase().includes(query)
      );
    });
  }, [categoryFilter, products, searchTerm]);

  const selectedUnitMeta = useMemo(
    () => units.find((unit) => unit.code === unitCodeInput) ?? null,
    [unitCodeInput, units],
  );

  async function refreshProducts() {
    await queryClient.invalidateQueries({
      queryKey: getListProductsApiV1ProductsGetQueryKey(),
    });
  }

  function openCreate() {
    setPanelMode({ kind: "create" });
    setNameInput("");
    setCategoryIdInput("");
    setUnitCodeInput(StandardUnitCode.unidad);
    setSalePriceInput("");
    setFormError(null);
    setFeedback(null);
  }

  function openEdit(product: ProductResponse) {
    setPanelMode({ kind: "edit", productId: product.id });
    setNameInput(product.name);
    setCategoryIdInput(product.category_id);
    setUnitCodeInput(product.unit_code);
    setSalePriceInput(product.sale_price);
    setFormError(null);
    setFeedback(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanedName = nameInput.trim();
    if (!cleanedName) {
      setFormError("El nombre del producto es obligatorio.");
      return;
    }
    if (!categoryIdInput) {
      setFormError("Debes seleccionar una categoría válida.");
      return;
    }

    const normalizedPrice = salePriceInput.trim().replace(",", ".");
    const numericPrice = Number(normalizedPrice);
    if (!normalizedPrice || Number.isNaN(numericPrice) || numericPrice <= 0) {
      setFormError("El precio de venta inicial debe ser mayor a cero.");
      return;
    }

    setFormError(null);
    try {
      if (panelMode.kind === "create") {
        const res = await createMutation.mutateAsync({
          data: {
            name: cleanedName,
            category_id: categoryIdInput,
            unit_code: unitCodeInput,
            sale_price: normalizedPrice,
          },
        });
        await refreshProducts();
        if (res.status === 201) {
          setFeedback(`Producto "${res.data.name}" configurado con éxito.`);
          setPanelMode({ kind: "idle" });
        }
      } else if (panelMode.kind === "edit") {
        const res = await updateMutation.mutateAsync({
          productId: panelMode.productId,
          data: {
            name: cleanedName,
            category_id: categoryIdInput,
            unit_code: unitCodeInput,
            sale_price: normalizedPrice,
          },
        });
        await refreshProducts();
        if (res.status === 200) {
          setFeedback(`Producto "${res.data.name}" actualizado correctamente.`);
          setPanelMode({ kind: "idle" });
        }
      }
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.detail : "No se pudo guardar el producto.",
      );
    }
  }

  const isLoading = productsQuery.isLoading || unitsQuery.isLoading || treeQuery.isLoading;
  const isError = productsQuery.isError || unitsQuery.isError;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="empty-state">Cargando productos y unidades estándar...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert-box alert-danger" style={{ marginTop: 0 }}>
            Error al cargar los productos desde la API. Verifica que el backend esté activo.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="split-layout">
      <div className="card">
        <div className="card-header">
          <div>
            <h5>Catálogo de Productos</h5>
            <div className="card-header-sub">
              Configura artículos por unidad o fraccionados y asigna su categoría y precio inicial.
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + Nuevo producto
          </button>
        </div>

        <div className="card-body">
          <div className="toolbar">
            <input
              className="search-input"
              type="text"
              placeholder="Buscar producto o categoría..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              aria-label="Filtrar por categoría"
              className="form-control product-filter-select"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.pathLabel}
                </option>
              ))}
            </select>
          </div>

          {categoryOptions.length === 0 ? (
            <div className="empty-state">
              <p style={{ marginBottom: "12px" }}>
                Primero necesitas al menos una categoría para crear productos.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onGoToCategories}
              >
                Ir a Mis Categorías
              </button>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="empty-state">
              {products.length === 0
                ? "Aún no tienes productos configurados. Usa \"+ Nuevo producto\" para crear el primero."
                : `No se encontraron productos para "${searchTerm}".`}
            </div>
          ) : (
            <div className="products-list">
              {visibleProducts.map((product) => {
                const isActive =
                  panelMode.kind === "edit" && panelMode.productId === product.id;
                return (
                  <div
                    key={product.id}
                    className={`product-row ${isActive ? "active-row" : ""}`}
                  >
                    <div className="product-row-info">
                      <div className="product-row-title">{product.name}</div>
                      <div className="product-row-meta">
                        <span className="path-pill">{product.category_path}</span>
                        <span
                          className={`unit-badge ${
                            product.allows_decimals ? "unit-badge-frac" : "unit-badge-int"
                          }`}
                        >
                          {product.unit_code} ·{" "}
                          {product.allows_decimals ? "Fraccionaria (3 dec.)" : "Entera"}
                        </span>
                      </div>
                    </div>

                    <div className="product-row-right">
                      <div className="product-metrics">
                        <strong>{formatCurrency(product.sale_price)}</strong>
                        <span>
                          Stock: {formatStock(product.current_stock, product.allows_decimals)}{" "}
                          {product.unit_code}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => openEdit(product)}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card side-card">
        <div className="card-header">
          <h5>Detalle y Acciones</h5>
        </div>

        <div className="card-body">
          {panelMode.kind === "idle" ? (
            <div>
              <h2>Configuración de Producto</h2>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "10px" }}>
                Crea productos nuevos o selecciona &ldquo;Editar&rdquo; en el listado para ajustar
                categoría, unidad de medida o precio de venta.
              </p>
              {feedback && <div className="alert-box alert-success">{feedback}</div>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2>
                {panelMode.kind === "create" ? "Nuevo Producto" : "Editar Producto"}
              </h2>

              <div className="form-group">
                <label htmlFor="product-name">Nombre del producto</label>
                <input
                  id="product-name"
                  className={`form-control ${formError ? "error-input" : ""}`}
                  type="text"
                  maxLength={120}
                  placeholder="Ej: Bebida Cola 1.5L o Queso Gauda"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-category">Categoría asignada</label>
                <select
                  id="product-category"
                  className="form-control"
                  value={categoryIdInput}
                  onChange={(event) => setCategoryIdInput(event.target.value)}
                >
                  <option value="">Selecciona una categoría...</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.pathLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Unidad de medida</label>
                <div className="unit-grid">
                  {units.map((unit) => {
                    const isSelected = unit.code === unitCodeInput;
                    return (
                      <button
                        key={unit.code}
                        type="button"
                        className={`unit-pill ${isSelected ? "selected" : ""}`}
                        onClick={() => setUnitCodeInput(unit.code)}
                      >
                        <strong>{unit.label}</strong>
                        <span>
                          {unit.allows_decimals
                            ? `Fraccionaria · ${unit.max_decimals} dec.`
                            : "Entera · sin decimales"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedUnitMeta && (
                  <div className="alert-box alert-info">
                    {selectedUnitMeta.allows_decimals
                      ? `Permite fracciones con hasta ${selectedUnitMeta.max_decimals} decimales (ej. 0.250 ${selectedUnitMeta.code}).`
                      : "Cantidades enteras sin decimales."}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="product-sale-price">Precio de venta inicial</label>
                <input
                  id="product-sale-price"
                  className="form-control"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ej: 1590"
                  value={salePriceInput}
                  onChange={(event) => setSalePriceInput(event.target.value)}
                />
              </div>

              {formError && <div className="alert-box alert-danger">{formError}</div>}

              <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Guardando..."
                    : panelMode.kind === "create"
                      ? "Guardar producto"
                      : "Guardar cambios"}
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
        </div>
      </div>
    </div>
  );
}
