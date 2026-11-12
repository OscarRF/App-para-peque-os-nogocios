import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CategoryCatalogWorkspace } from "../components/CategoryCatalogWorkspace";
import { ApiError } from "@/lib/api-client";

const mockListTemplates = vi.fn();
const mockApplyTemplate = vi.fn();
const mockGetTree = vi.fn();
const mockCreateCategory = vi.fn();
const mockUpdateCategory = vi.fn();
const mockDeleteCategory = vi.fn();
const mockClearCatalog = vi.fn();

vi.mock("@/api/generated/endpoints/categories/categories", () => ({
  useListTemplatesApiV1CategoriesTemplatesGet: () => mockListTemplates(),
  useApplyTemplateApiV1CategoriesTemplatesApplyPost: () => ({
    mutateAsync: mockApplyTemplate,
    isPending: false,
  }),
  useGetCategoryTreeApiV1CategoriesTreeGet: () => mockGetTree(),
  useCreateCategoryApiV1CategoriesPost: () => ({
    mutateAsync: mockCreateCategory,
    isPending: false,
  }),
  useUpdateCategoryApiV1CategoriesCategoryIdPatch: () => ({
    mutateAsync: mockUpdateCategory,
    isPending: false,
  }),
  useDeleteCategoryApiV1CategoriesCategoryIdDelete: () => ({
    mutateAsync: mockDeleteCategory,
    isPending: false,
  }),
  useClearCatalogApiV1CategoriesDelete: () => ({
    mutateAsync: mockClearCatalog,
    isPending: false,
  }),
  getGetCategoryTreeApiV1CategoriesTreeGetQueryKey: () => ["/api/v1/categories/tree"],
}));

vi.mock("@/api/generated/endpoints/products/products", () => ({
  useListUnitsApiV1ProductsUnitsGet: () => ({
    data: { data: [], status: 200 },
    isLoading: false,
    isError: false,
  }),
  useListProductsApiV1ProductsGet: () => ({
    data: { data: [], status: 200 },
    isLoading: false,
    isError: false,
  }),
  useCreateProductApiV1ProductsPost: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateProductApiV1ProductsProductIdPatch: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  getListProductsApiV1ProductsGetQueryKey: () => ["/api/v1/products"],
}));

function renderWorkspace() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CategoryCatalogWorkspace />
    </QueryClientProvider>,
  );
}

const SAMPLE_TEMPLATES = [
  {
    code: "almacen",
    title: "Almacén / Minimarket",
    description: "Estructura para abarrotes, bebidas y lácteos.",
    preview_tree: [
      { name: "Abarrotes", children: [{ name: "Despensa", children: [] }] },
    ],
  },
  {
    code: "botilleria",
    title: "Botillería",
    description: "Cervezas, vinos y destilados.",
    preview_tree: [{ name: "Cervezas", children: [{ name: "Artesanales", children: [] }] }],
  },
  {
    code: "comercio_general",
    title: "Comercio General",
    description: "Estructura flexible para comercio.",
    preview_tree: [{ name: "Productos Principales", children: [] }],
  },
];

const SAMPLE_TREE = [
  {
    id: "root-1",
    name: "Abarrotes",
    parent_id: null,
    level: 0,
    children: [
      {
        id: "child-1",
        name: "Despensa",
        parent_id: "root-1",
        level: 1,
        children: [
          {
            id: "leaf-1",
            name: "Arroz y Legumbres",
            parent_id: "child-1",
            level: 2,
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "root-2",
    name: "Bebidas y Líquidos",
    parent_id: null,
    level: 0,
    children: [],
  },
];

describe("CategoryCatalogWorkspace (Intent 1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTemplates.mockReturnValue({
      data: { data: SAMPLE_TEMPLATES, status: 200 },
      isLoading: false,
      isError: false,
    });
    mockGetTree.mockReturnValue({
      data: { data: SAMPLE_TREE, status: 200 },
      isLoading: false,
      isError: false,
    });
  });

  it("Escenario 1: muestra las 3 plantillas y aplica la plantilla seleccionada", async () => {
    mockGetTree.mockReturnValue({
      data: { data: [], status: 200 },
      isLoading: false,
      isError: false,
    });
    mockApplyTemplate.mockResolvedValue({
      data: {
        template_code: "botilleria",
        created_count: 18,
        skipped_count: 0,
        tree: [],
      },
      status: 200,
    });

    const user = userEvent.setup();
    renderWorkspace();

    expect(screen.getByText("Almacén / Minimarket")).toBeInTheDocument();
    expect(screen.getByText("Botillería")).toBeInTheDocument();
    expect(screen.getByText("Comercio General")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Botillería/i }));
    expect(
      screen.getByText(/Vista previa de niveles que se crearán \(Botillería\)/i),
    ).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Cervezas")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Cargar esta plantilla en mi catálogo/i }),
    );

    expect(mockApplyTemplate).toHaveBeenCalledWith({
      data: { template_code: "botilleria" },
    });
    expect(await screen.findByText(/18 creadas/i)).toBeInTheDocument();
  });

  it("Escenario 2: crea una subcategoría mostrando la ruta padre y valida nombre vacío", async () => {
    mockCreateCategory.mockResolvedValue({
      data: {
        id: "new-1",
        name: "Porotos y Lentejas",
        parent_id: "leaf-1",
        level: 3,
        children: [],
      },
      status: 201,
    });

    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole("button", { name: /2\. Mis Categorías/i }));

    const leafRow = screen.getByText("Arroz y Legumbres").closest(".tree-row") as HTMLElement;
    await user.click(within(leafRow).getByRole("button", { name: /\+ Subcategoría/i }));

    expect(
      screen.getByText("Abarrotes > Despensa > Arroz y Legumbres"),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nombre/i);
    await user.clear(nameInput);
    await user.type(nameInput, "   ");
    await user.click(screen.getByRole("button", { name: /Guardar/i }));
    expect(screen.getByText(/El nombre es obligatorio/i)).toBeInTheDocument();
    expect(mockCreateCategory).not.toHaveBeenCalled();

    await user.clear(nameInput);
    await user.type(nameInput, "Porotos y Lentejas");
    await user.click(screen.getByRole("button", { name: /Guardar/i }));

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        data: { name: "Porotos y Lentejas", parent_id: "leaf-1" },
      });
    });
  });

  it("Escenario 3: al editar excluye al nodo y sus descendientes del selector de padre y permite mover a raíz", async () => {
    mockUpdateCategory.mockResolvedValue({
      data: {
        id: "child-1",
        name: "Despensa Básica",
        parent_id: null,
        level: 0,
        children: [],
      },
      status: 200,
    });

    const user = userEvent.setup();
    renderWorkspace();
    await user.click(screen.getByRole("button", { name: /2\. Mis Categorías/i }));

    const despensaRow = screen.getByText("Despensa").closest(".tree-row") as HTMLElement;
    await user.click(within(despensaRow).getByRole("button", { name: /Editar/i }));

    const parentSelect = screen.getByLabelText(/Categoría padre/i) as HTMLSelectElement;
    const optionTexts = Array.from(parentSelect.options).map((opt) => opt.text);
    expect(optionTexts).not.toContain("Despensa");
    expect(optionTexts.some((text) => text.includes("Arroz y Legumbres"))).toBe(false);
    expect(optionTexts.some((text) => text.includes("Raíz"))).toBe(true);

    const nameInput = screen.getByLabelText(/Nombre/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Despensa Básica");
    await user.selectOptions(parentSelect, "");
    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith({
        categoryId: "child-1",
        data: { name: "Despensa Básica", parent_id: null },
      });
    });
  });

  it("Escenario 4 y 5: muestra errores controlados 409 al intentar borrar con hijos o duplicar nombre y permite borrar hoja", async () => {
    mockDeleteCategory
      .mockRejectedValueOnce(
        new ApiError(409, "Cannot delete category with existing subcategories"),
      )
      .mockResolvedValueOnce({ status: 204 });
    mockCreateCategory.mockRejectedValue(
      new ApiError(409, "Category 'Bebidas y Líquidos' already exists under this parent"),
    );

    const user = userEvent.setup();
    renderWorkspace();
    await user.click(screen.getByRole("button", { name: /2\. Mis Categorías/i }));

    const abarrotesRow = screen.getByText("Abarrotes").closest(".tree-row") as HTMLElement;
    await user.click(within(abarrotesRow).getByRole("button", { name: /Eliminar/i }));
    expect(
      await screen.findByText(/contiene subcategorías activas/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Entendido/i }));

    const bebidasRow = screen.getByText("Bebidas y Líquidos").closest(".tree-row") as HTMLElement;
    await user.click(within(bebidasRow).getByRole("button", { name: /Eliminar/i }));
    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenLastCalledWith({ categoryId: "root-2" });
    });
    expect(
      await screen.findByText(/Categoría "Bebidas y Líquidos" eliminada\./i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /\+ Nueva categoría principal/i }));
    await user.type(screen.getByLabelText(/Nombre/i), "Bebidas y Líquidos");
    await user.click(screen.getByRole("button", { name: /Guardar/i }));
    expect(
      await screen.findByText(/already exists under this parent/i),
    ).toBeInTheDocument();
  });

  it("Adminty Shell: muestra badges, estado de API, colapsa ramas/sidebar sin cuadros KPI y filtra con buscador rápido", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    expect(
      screen.queryByRole("region", { name: /Resumen del catálogo/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Categorías Totales")).not.toBeInTheDocument();
    expect(screen.getByText("API Activa")).toBeInTheDocument();

    const sidebar = screen.getByRole("navigation", { name: /Menú principal/i });
    const templatesNavBtn = within(sidebar).getByRole("button", {
      name: /1\. Elegir Plantilla/i,
    });
    const treeNavBtn = within(sidebar).getByRole("button", {
      name: /2\. Mis Categorías/i,
    });
    expect(within(templatesNavBtn).getByText("3")).toBeInTheDocument();
    expect(within(treeNavBtn).getByText("4")).toBeInTheDocument();

    const collapseBtn = screen.getByRole("button", { name: /Alternar menú lateral/i });
    expect(collapseBtn).toHaveAttribute("aria-expanded", "true");
    await user.click(collapseBtn);
    expect(collapseBtn).toHaveAttribute("aria-expanded", "false");

    await user.click(treeNavBtn);
    expect(screen.getByText("Despensa")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Colapsar Abarrotes/i }));
    expect(screen.queryByText("Despensa")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Expandir Abarrotes/i }));
    expect(screen.getByText("Despensa")).toBeInTheDocument();

    await user.click(templatesNavBtn);
    const quickSearch = screen.getByPlaceholderText(/Buscar en catálogo\.\.\./i);
    await user.type(quickSearch, "Arroz");
    expect(await screen.findByText("Arroz y Legumbres")).toBeInTheDocument();
    expect(screen.queryByText("Bebidas y Líquidos")).not.toBeInTheDocument();
  });

  it("Adminty Shell: muestra API Sin conexión cuando fallan las consultas", () => {
    mockListTemplates.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    mockGetTree.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderWorkspace();
    expect(screen.getByText("API Sin conexión")).toBeInTheDocument();
  });

  it("Limpiar categorías: deshabilita si está vacío, cancela con No, muestra error si falla y limpia + redirige con Sí", async () => {
    const user = userEvent.setup();
    mockGetTree.mockReturnValue({
      data: { data: [], status: 200 },
      isLoading: false,
      isError: false,
    });
    const { unmount } = renderWorkspace();
    await user.click(screen.getByRole("button", { name: /2\. Mis Categorías/i }));
    expect(screen.getByRole("button", { name: /Limpiar categorías/i })).toBeDisabled();
    unmount();

    mockGetTree.mockReturnValue({
      data: { data: SAMPLE_TREE, status: 200 },
      isLoading: false,
      isError: false,
    });
    mockClearCatalog
      .mockRejectedValueOnce(new ApiError(500, "Error interno al limpiar"))
      .mockResolvedValueOnce({
        data: { deleted_count: 4 },
        status: 200,
      });

    renderWorkspace();

    await user.click(screen.getByRole("button", { name: /2\. Mis Categorías/i }));

    const clearBtn = screen.getByRole("button", { name: /Limpiar categorías/i });
    expect(clearBtn).toBeEnabled();
    await user.click(clearBtn);

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("¿Desea eliminar todas las categorías y cargar uno nuevo?"),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^No$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockClearCatalog).not.toHaveBeenCalled();

    await user.click(clearBtn);
    const errorDialog = await screen.findByRole("dialog");
    await user.click(within(errorDialog).getByRole("button", { name: /^Sí$/i }));
    expect(await within(errorDialog).findByText("Error interno al limpiar")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(within(errorDialog).getByRole("button", { name: /^Sí$/i }));

    await waitFor(() => {
      expect(mockClearCatalog).toHaveBeenCalledTimes(2);
    });

    expect(
      await screen.findByRole("button", { name: /Cargar esta plantilla en mi catálogo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Plantillas Iniciales por Rubro/i }),
    ).toBeInTheDocument();
  });
});
