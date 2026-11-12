"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  getGetCategoryTreeApiV1CategoriesTreeGetQueryKey,
  useApplyTemplateApiV1CategoriesTemplatesApplyPost,
  useListTemplatesApiV1CategoriesTemplatesGet,
} from "@/api/generated/endpoints/categories/categories";
import type { BusinessTemplateCode, TemplateSummaryResponse } from "@/api/generated/model";
import { ApiError } from "@/lib/api-client";

interface PreviewNode {
  name?: string;
  children?: PreviewNode[];
}

const TEMPLATE_ACCENT: Record<string, string> = {
  almacen: "accent-coral",
  botilleria: "accent-teal",
  comercio_general: "accent-green",
};

function renderTemplateGlyph(code: string) {
  if (code === "botilleria") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 22h8" />
        <path d="M12 15v7" />
        <path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" />
      </svg>
    );
  }
  if (code === "comercio_general") {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    );
  }
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function renderPreviewSummary(branch: PreviewNode): string[] {
  const lines: string[] = [];
  for (const child of branch.children ?? []) {
    const grandchildren = (child.children ?? [])
      .map((item) => item.name)
      .filter((name): name is string => Boolean(name));
    if (grandchildren.length > 0) {
      for (const grand of grandchildren.slice(0, 2)) {
        lines.push(`${child.name ?? ""} → ${grand}`);
      }
    } else if (child.name) {
      lines.push(child.name);
    }
  }
  return lines.slice(0, 4);
}

interface TemplateSelectorProps {
  onGoToTree: () => void;
}

export function TemplateSelector({ onGoToTree }: TemplateSelectorProps) {
  const queryClient = useQueryClient();
  const templatesQuery = useListTemplatesApiV1CategoriesTemplatesGet();
  const applyMutation = useApplyTemplateApiV1CategoriesTemplatesApplyPost();

  const [selectedCode, setSelectedCode] = useState<BusinessTemplateCode>("almacen");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const templates: TemplateSummaryResponse[] = templatesQuery.data?.data ?? [];
  const selectedTemplate =
    templates.find((item) => item.code === selectedCode) ?? templates[0] ?? null;

  async function handleApply() {
    if (!selectedTemplate) return;
    setErrorMessage(null);
    setResultMessage(null);
    try {
      const response = await applyMutation.mutateAsync({
        data: { template_code: selectedTemplate.code },
      });
      await queryClient.invalidateQueries({
        queryKey: getGetCategoryTreeApiV1CategoriesTreeGetQueryKey(),
      });
      if (response.status === 200) {
        const { created_count, skipped_count } = response.data;
        setResultMessage(
          `Plantilla "${selectedTemplate.title}" aplicada: ${created_count} creadas, ${skipped_count} omitidas (ya existentes).`,
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError ? err.detail : "No se pudo aplicar la plantilla.",
      );
    }
  }

  if (templatesQuery.isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="empty-state">Cargando plantillas por giro...</div>
        </div>
      </div>
    );
  }

  if (templatesQuery.isError) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert-box alert-danger" style={{ marginTop: 0 }}>
            No se pudo conectar con la API de plantillas. Verifica que el backend esté activo en
            puerto 8000.
          </div>
        </div>
      </div>
    );
  }

  const selectedBranches = (selectedTemplate?.preview_tree ?? []) as PreviewNode[];

  return (
    <div className="template-workspace">
      <div className="grid-3">
        {templates.map((template) => {
          const isSelected = selectedTemplate?.code === template.code;
          const previewBranches = (template.preview_tree ?? []) as PreviewNode[];
          const accentClass = TEMPLATE_ACCENT[template.code] ?? "accent-teal";
          return (
            <button
              key={template.code}
              type="button"
              className={`biz-card ${accentClass} ${isSelected ? "selected" : ""}`}
              onClick={() => {
                setSelectedCode(template.code);
                setResultMessage(null);
                setErrorMessage(null);
              }}
            >
              <div className="biz-card-top">
                <span className={`biz-glyph ${accentClass}`}>
                  {renderTemplateGlyph(template.code)}
                </span>
                {isSelected && <span className="check-dot">Seleccionado</span>}
              </div>
              <div className="biz-title">{template.title}</div>
              <div className="biz-desc">{template.description}</div>
              <div className="biz-tags">
                {previewBranches.slice(0, 4).map((branch, idx) => (
                  <span key={`${template.code}-${idx}`} className="tag">
                    {branch.name}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {selectedTemplate && (
        <div className="adminty-two-col">
          <div className="card">
            <div className="card-header">
              <div>
                <h5>Vista previa de niveles que se crearán ({selectedTemplate.title})</h5>
                <div className="card-header-sub">
                  Estructura jerárquica lista para cargar sin duplicar categorías existentes.
                </div>
              </div>
            </div>
            <div className="card-body" style={{ paddingTop: "8px" }}>
              <table className="adminty-table">
                <thead>
                  <tr>
                    <th>Rama Principal</th>
                    <th>Subcategorías</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBranches.slice(0, 6).map((branch, idx) => {
                    const summaryLines = renderPreviewSummary(branch);
                    return (
                      <tr key={`preview-${idx}`}>
                        <td className="table-branch-name">
                          <span className="branch-dot" aria-hidden="true" />
                          <strong>{branch.name}</strong>
                        </td>
                        <td>
                          {summaryLines.length > 0 ? (
                            <div className="preview-chips">
                              {summaryLines.map((line, lineIdx) => (
                                <span key={lineIdx} className="preview-chip">
                                  {line}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="muted-cell">Categoría raíz</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card action-summary-card">
            <div className="card-header">
              <h5>Aplicar Plantilla</h5>
            </div>
            <div className="card-body action-summary-body">
              <div
                className={`summary-ring ${TEMPLATE_ACCENT[selectedTemplate.code] ?? "accent-teal"}`}
                aria-hidden="true"
              >
                {renderTemplateGlyph(selectedTemplate.code)}
              </div>
              <h2 className="summary-title">Listo para importar</h2>
              <p className="summary-desc">
                Carga las categorías de este rubro en tu catálogo sin duplicar las ya existentes.
              </p>

              <div className="summary-meta-row">
                <div>
                  <span className="summary-meta-label">Ramas Base</span>
                  <strong>{selectedBranches.length}</strong>
                </div>
                <div>
                  <span className="summary-meta-label">Modo</span>
                  <strong>Idempotente</strong>
                </div>
              </div>

              <div className="wizard-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={applyMutation.isPending}
                  onClick={handleApply}
                >
                  {applyMutation.isPending
                    ? "Cargando plantilla..."
                    : "✓ Cargar esta plantilla en mi catálogo"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onGoToTree}>
                  Ir a mis categorías
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {resultMessage && (
        <div className="alert-box alert-success" style={{ marginTop: "4px" }}>
          <strong>✓ Listo:</strong> {resultMessage}{" "}
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginLeft: "10px", padding: "4px 10px", fontSize: "12px" }}
            onClick={onGoToTree}
          >
            Ver árbol de categorías →
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="alert-box alert-danger" style={{ marginTop: "4px" }}>
          {errorMessage}
        </div>
      )}
    </div>
  );
}
