"use client";

import { useMemo, useState } from "react";

import {
  useGetCategoryTreeApiV1CategoriesTreeGet,
  useListTemplatesApiV1CategoriesTemplatesGet,
} from "@/api/generated/endpoints/categories/categories";
import { useListProductsApiV1ProductsGet } from "@/api/generated/endpoints/products/products";
import { ProductsManager } from "@/features/products/components/ProductsManager";

import { getTreeStats } from "../tree-utils";
import { CategoryTreeManager } from "./CategoryTreeManager";
import { TemplateSelector } from "./TemplateSelector";

type ActiveTab = "templates" | "tree" | "products";

export function CategoryCatalogWorkspace() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("templates");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const treeQuery = useGetCategoryTreeApiV1CategoriesTreeGet();
  const templatesQuery = useListTemplatesApiV1CategoriesTemplatesGet();
  const productsQuery = useListProductsApiV1ProductsGet();

  const tree = useMemo(() => treeQuery.data?.data ?? [], [treeQuery.data]);
  const templates = useMemo(() => templatesQuery.data?.data ?? [], [templatesQuery.data]);
  const products = useMemo(
    () => (productsQuery.data?.status === 200 ? productsQuery.data.data : []),
    [productsQuery.data],
  );
  const stats = useMemo(() => getTreeStats(tree), [tree]);
  const hasApiError = treeQuery.isError || templatesQuery.isError || productsQuery.isError;

  function handleQuickSearch(value: string) {
    setSearchTerm(value);
    if (value.trim() !== "" && activeTab === "templates") {
      setActiveTab("tree");
    }
  }

  return (
    <div className={`pcoded-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <header className="pcoded-header">
        <div className="navbar-logo">
          <div className="brand-link">
            <span className="brand-mark" aria-hidden="true">
              M
            </span>
            <span className="brand-text">MiNegocio Ágil</span>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="Alternar menú lateral"
            aria-expanded={!sidebarCollapsed}
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            {sidebarCollapsed ? "▸" : "☰"}
          </button>
        </div>

        <div className="navbar-container">
          <div className="navbar-left">
            <div className="header-search-wrap">
              <svg
                className="header-search-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                className="header-search-input"
                placeholder="Buscar en catálogo..."
                aria-label="Buscar en catálogo"
                value={searchTerm}
                onChange={(event) => handleQuickSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="navbar-right">
            <div className="status-pill" title="Estado de conexión con FastAPI">
              <span className={`status-dot ${hasApiError ? "error" : ""}`} aria-hidden="true" />
              <span>{hasApiError ? "API Sin conexión" : "API Activa"}</span>
            </div>
            <div className="user-profile">
              <span className="user-avatar" aria-hidden="true">
                DN
              </span>
              <span className="user-name">Dueño · Mi Negocio</span>
            </div>
          </div>
        </div>
      </header>

      <div className="pcoded-body">
        <aside className="pcoded-navbar">
          <nav aria-label="Menú principal">
            <div className="pcoded-navigatio-lavel">Catálogo</div>
            <ul className="pcoded-item">
              <li>
                <button
                  type="button"
                  className={`pcoded-nav-btn ${activeTab === "templates" ? "active" : ""}`}
                  onClick={() => setActiveTab("templates")}
                >
                  <span className="pcoded-nav-left">
                    <span className="pcoded-micon" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="7" height="7" x="3" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="14" rx="1" />
                        <rect width="7" height="7" x="3" y="14" rx="1" />
                      </svg>
                    </span>
                    <span className="pcoded-mtext">1. Elegir Plantilla</span>
                  </span>
                  <span className="pcoded-badge badge-teal">{templates.length}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`pcoded-nav-btn ${activeTab === "tree" ? "active" : ""}`}
                  onClick={() => setActiveTab("tree")}
                >
                  <span className="pcoded-nav-left">
                    <span className="pcoded-micon" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 3v6" />
                        <path d="M6 15v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
                        <rect width="6" height="4" x="3" y="15" rx="1" />
                        <rect width="6" height="4" x="15" y="15" rx="1" />
                      </svg>
                    </span>
                    <span className="pcoded-mtext">2. Mis Categorías</span>
                  </span>
                  <span className="pcoded-badge badge-coral">{stats.total}</span>
                </button>
              </li>
            </ul>

            <div className="pcoded-navigatio-lavel">Inventario</div>
            <ul className="pcoded-item">
              <li>
                <button
                  type="button"
                  className={`pcoded-nav-btn ${activeTab === "products" ? "active" : ""}`}
                  onClick={() => setActiveTab("products")}
                >
                  <span className="pcoded-nav-left">
                    <span className="pcoded-micon" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                        <path d="m3.3 7 8.7 5 8.7-5" />
                        <path d="M12 22V12" />
                      </svg>
                    </span>
                    <span className="pcoded-mtext">Productos y Unidades</span>
                  </span>
                  <span className="pcoded-badge badge-teal">{products.length}</span>
                </button>
              </li>
              <li>
                <button type="button" className="pcoded-nav-btn" disabled>
                  <span className="pcoded-nav-left">
                    <span className="pcoded-micon" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 3v12" />
                        <path d="m8 11 4 4 4-4" />
                        <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
                      </svg>
                    </span>
                    <span className="pcoded-mtext">Entradas de Mercadería</span>
                  </span>
                  <span className="pcoded-badge badge-muted">Pronto</span>
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="pcoded-main-container">
          <div className="page-header">
            <div className="page-header-title">
              <h4>
                {activeTab === "templates"
                  ? "Plantillas Iniciales por Rubro"
                  : activeTab === "tree"
                    ? "Catálogo de Categorías Multinivel"
                    : "Productos y Unidades de Medida"}
              </h4>
              <span>
                {activeTab === "templates"
                  ? "Importa una estructura predefinida y adáptala a la realidad de tu negocio."
                  : activeTab === "tree"
                    ? "Organiza ramas, crea subcategorías al vuelo y mantén limpio tu inventario."
                    : "Da de alta productos por unidad o fraccionados y define su precio de venta inicial."}
              </span>
            </div>
            <div className="breadcrumb" aria-label="Ruta actual">
              <span className="breadcrumb-link">Inicio</span>
              <span aria-hidden="true">/</span>
              <span>{activeTab === "products" ? "Inventario" : "Catálogo"}</span>
              <span aria-hidden="true">/</span>
              <span>
                {activeTab === "templates"
                  ? "Plantillas"
                  : activeTab === "tree"
                    ? "Mis Categorías"
                    : "Productos y Unidades"}
              </span>
            </div>
          </div>

          {activeTab === "templates" && (
            <TemplateSelector onGoToTree={() => setActiveTab("tree")} />
          )}
          {activeTab === "tree" && (
            <CategoryTreeManager
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onGoToTemplates={() => setActiveTab("templates")}
            />
          )}
          {activeTab === "products" && (
            <ProductsManager
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onGoToCategories={() => setActiveTab("tree")}
            />
          )}
        </main>
      </div>
    </div>
  );
}
