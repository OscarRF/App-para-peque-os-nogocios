import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CategoryCatalogWorkspace } from "@/features/catalog/components/CategoryCatalogWorkspace";
import { ApiError } from "@/lib/api-client";

const mockListTemplates = vi.fn();
const mockGetTree = vi.fn();
const mockListUnits = vi.fn();
const mockListProducts = vi.fn();
const mockCreateProduct = vi.fn();
const mockUpdateProduct = vi.fn();

vi.mock("@/api/generated/endpoints/categories/categories", () => ({
  useListTemplatesApiV1CategoriesTemplatesGet: () => mockListTemplates(),
  useApplyTemplateApiV1CategoriesTemplatesApplyPost: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useGetCategoryTreeApiV1CategoriesTreeGet: () => mockGetTree(),
  useCreateCategoryApiV1CategoriesPost: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateCategoryApiV1CategoriesCategoryIdPatch: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteCategoryApiV1CategoriesCategoryIdDelete: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useClearCatalogApiV1CategoriesDelete: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  getGetCategoryTreeApiV1CategoriesTreeGetQueryKey: () => ["/api/v1/categories/tree"],
}));

vi.mock("@/api/generated/endpoints/products/products", () => ({
  useListUnitsApiV1ProductsUnitsGet: () => mockListUnits(),
  useListProductsApiV1ProductsGet: () => mockListProducts(),
  useCreateProductApiV1ProductsPost: () => ({
    mutateAsync: mockCreateProduct,
    isPending: false,
  }),
  useUpdateProductApiV1ProductsProductIdPatch: () => ({
    mutateAsync: mockUpdateProduct,
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

const SAMPLE_UNITS = [
  { code: "unidad", label: "Unidad", kind: "integer", max_decimals: 0, allows_decimals: false },
  { code: "pack", label: "Pack / Caja", kind: "integer", max_decimals: 0, allows_decimals: false },
  { code: "kg", label: "Kilogramo (kg)", kind: "fractional", max_decimals: 3, allows_decimals: true },
  { code: "g", label: "Gramo (g)", kind: "fractional", max_decimals: 3, allows_decimals: true },
  { code: "l", label: "Litro (l)", kind: "fractional", max_decimals: 3, allows_decimals: true },
  { code: "ml", label: "Mililitro (ml)", kind: "fractional", max_decimals: 3, allows_decimals: true },
];

const SAMPLE_TREE = [
  {
    id: "cat-1",
    name: "Bebidas y Líquidos",
    parent_id: null,
    level: 0,
    children: [
      {
        id: "cat-2",
        name: "Gaseosas",
        parent_id: "cat-1",
        level: 1,
        children: [],
      },
    ],
  },
  {
    id: "cat-3",
    name: "Quesos y Fiambres",
    parent_id: null,
    level: 0,
    children: [],
  },
];

const SAMPLE_PRODUCTS = [
  {
    id: "prod-1",
    name: "Bebida Cola 1.5L",
    category_id: "cat-2",
    category_path: "Bebidas y Líquidos > Gaseosas",
    unit_code: "unidad",
    unit_kind: "integer",
    max_decimals: 0,
    allows_decimals: false,
    sale_price: "1590.00",
    current_stock: "0.000",
  },
  {
    id: "prod-2",
    name: "Queso Gauda Laminado",
    category_id: "cat-3",
    category_path: "Quesos y Fiambres",
    unit_code: "kg",
    unit_kind: "fractional",
    max_decimals: 3,
    allows_decimals: true,
    sale_price: "8990.00",
    current_stock: "0.000",
  },
];

describe("ProductsManager (Intent 2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTemplates.mockReturnValue({
      data: { data: [], status: 200 },
      isLoading: false,
      isError: false,
    });
    mockGetTree.mockReturnValue({
      data: { data: SAMPLE_TREE, status: 200 },
      isLoading: false,
      isError: false,
    });
    mockListUnits.mockReturnValue({
      data: { data: SAMPLE_UNITS, status: 200 },
      isLoading: false,
      isError: false,
    });
    mockListProducts.mockReturnValue({
      data: { data: SAMPLE_PRODUCTS, status: 200 },
      isLoading: false,
      isError: false,
    });
  });

  it("Escenario 1 y 2: navega a Productos y Unidades, lista productos y crea uno fraccionario", async () => {
    const user = userEvent.setup();
    mockCreateProduct.mockResolvedValue({
      data: {
        id: "prod-3",
        name: "Jamón Artesanal",
        category_id: "cat-3",
        category_path: "Quesos y Fiambres",
        unit_code: "kg",
        unit_kind: "fractional",
        max_decimals: 3,
        allows_decimals: true,
        sale_price: "9500.00",
        current_stock: "0.000",
      },
      status: 201,
    });

    renderWorkspace();

    const sidebar = screen.getByRole("navigation", { name: /Menú principal/i });
    await user.click(within(sidebar).getByRole("button", { name: /Productos y Unidades/i }));

    expect(
      screen.getByRole("heading", { name: /Productos y Unidades de Medida/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bebida Cola 1.5L")).toBeInTheDocument();
    expect(screen.getByText("Queso Gauda Laminado")).toBeInTheDocument();
    expect(screen.getAllByText(/Fraccionaria/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /\+ Nuevo producto/i }));
    await user.type(screen.getByLabelText(/Nombre del producto/i), "Jamón Artesanal");
    await user.selectOptions(screen.getByLabelText(/Categoría asignada/i), "cat-3");
    await user.click(screen.getByRole("button", { name: /Kilogramo \(kg\)/i }));
    await user.type(screen.getByLabelText(/Precio de venta inicial/i), "9500");

    await user.click(screen.getByRole("button", { name: /Guardar producto/i }));

    await waitFor(() => {
      expect(mockCreateProduct).toHaveBeenCalledWith({
        data: {
          name: "Jamón Artesanal",
          category_id: "cat-3",
          unit_code: "kg",
          sale_price: "9500",
        },
      });
    });
  });

  it("Escenario 3 y 4: valida categoría obligatoria, precio inválido y error 409 duplicado", async () => {
    const user = userEvent.setup();
    mockCreateProduct.mockRejectedValue(
      new ApiError(409, "Product 'Bebida Cola 1.5L' already exists in this category"),
    );

    renderWorkspace();

    await user.click(screen.getByRole("button", { name: /Productos y Unidades/i }));
    await user.click(screen.getByRole("button", { name: /\+ Nuevo producto/i }));

    await user.type(screen.getByLabelText(/Nombre del producto/i), "Bebida Cola 1.5L");
    await user.type(screen.getByLabelText(/Precio de venta inicial/i), "1590");
    await user.click(screen.getByRole("button", { name: /Guardar producto/i }));
    expect(await screen.findByText(/Debes seleccionar una categoría válida/i)).toBeInTheDocument();
    expect(mockCreateProduct).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText(/Categoría asignada/i), "cat-2");
    await user.clear(screen.getByLabelText(/Precio de venta inicial/i));
    await user.type(screen.getByLabelText(/Precio de venta inicial/i), "0");
    await user.click(screen.getByRole("button", { name: /Guardar producto/i }));
    expect(await screen.findByText(/mayor a cero/i)).toBeInTheDocument();
    expect(mockCreateProduct).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/Precio de venta inicial/i));
    await user.type(screen.getByLabelText(/Precio de venta inicial/i), "1590");
    await user.click(screen.getByRole("button", { name: /Guardar producto/i }));
    expect(
      await screen.findByText(/already exists in this category/i),
    ).toBeInTheDocument();
  });

  it("Permite editar un producto existente y filtrar por búsqueda o categoría", async () => {
    const user = userEvent.setup();
    mockUpdateProduct.mockResolvedValue({
      data: { ...SAMPLE_PRODUCTS[0], sale_price: "1750.00" },
      status: 200,
    });

    renderWorkspace();

    await user.click(screen.getByRole("button", { name: /Productos y Unidades/i }));

    await user.type(screen.getByPlaceholderText(/Buscar producto/i), "Gauda");
    expect(screen.getByText("Queso Gauda Laminado")).toBeInTheDocument();
    expect(screen.queryByText("Bebida Cola 1.5L")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText(/Buscar producto/i));
    const colaRow = screen.getByText("Bebida Cola 1.5L").closest(".product-row") as HTMLElement;
    await user.click(within(colaRow).getByRole("button", { name: /Editar/i }));

    const priceInput = screen.getByLabelText(/Precio de venta inicial/i);
    await user.clear(priceInput);
    await user.type(priceInput, "1750");
    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(mockUpdateProduct).toHaveBeenCalledWith({
        productId: "prod-1",
        data: {
          name: "Bebida Cola 1.5L",
          category_id: "cat-2",
          unit_code: "unidad",
          sale_price: "1750",
        },
      });
    });
  });
});
