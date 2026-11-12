from dataclasses import dataclass

from features.catalog.schemas import BusinessTemplateCode


@dataclass(frozen=True)
class TemplateDefinition:
    """Metadata and nested category tree for a starter business template."""

    code: BusinessTemplateCode
    title: str
    description: str
    tree: tuple[dict, ...]


TEMPLATES: dict[BusinessTemplateCode, TemplateDefinition] = {
    BusinessTemplateCode.ALMACEN: TemplateDefinition(
        code=BusinessTemplateCode.ALMACEN,
        title="Almacén / Minimarket",
        description="Estructura para abarrotes, bebidas, lácteos, panadería y aseo.",
        tree=(
            {
                "name": "Abarrotes",
                "children": [
                    {
                        "name": "Despensa",
                        "children": [
                            {"name": "Arroz y Legumbres", "children": []},
                            {"name": "Fideos y Pastas", "children": []},
                            {"name": "Aceites y Condimentos", "children": []},
                        ],
                    },
                    {"name": "Conservas y Enlatados", "children": []},
                    {
                        "name": "Desayuno y Once",
                        "children": [
                            {"name": "Café y Té", "children": []},
                            {"name": "Galletas y Cereales", "children": []},
                        ],
                    },
                ],
            },
            {
                "name": "Bebidas y Líquidos",
                "children": [
                    {"name": "Aguas y Jugos", "children": []},
                    {"name": "Gaseosas", "children": []},
                    {"name": "Energéticas e Isotónicas", "children": []},
                ],
            },
            {
                "name": "Lácteos y Refrigerados",
                "children": [
                    {"name": "Leches y Yogures", "children": []},
                    {"name": "Quesos y Fiambres", "children": []},
                    {"name": "Huevos", "children": []},
                ],
            },
            {
                "name": "Panadería y Snacks",
                "children": [
                    {"name": "Pan y Pastelería", "children": []},
                    {"name": "Snacks Salados", "children": []},
                    {"name": "Dulces y Confites", "children": []},
                ],
            },
            {
                "name": "Aseo y Hogar",
                "children": [
                    {"name": "Limpieza", "children": []},
                    {"name": "Higiene Personal", "children": []},
                    {"name": "Mascotas", "children": []},
                ],
            },
        ),
    ),
    BusinessTemplateCode.BOTILLERIA: TemplateDefinition(
        code=BusinessTemplateCode.BOTILLERIA,
        title="Botillería",
        description="Organizado por cervezas, vinos, destilados, mixers y complementos.",
        tree=(
            {
                "name": "Cervezas",
                "children": [
                    {"name": "Artesanales", "children": []},
                    {
                        "name": "Industriales",
                        "children": [
                            {"name": "Lata", "children": []},
                            {"name": "Botella / Retornable", "children": []},
                        ],
                    },
                ],
            },
            {
                "name": "Vinos y Espumantes",
                "children": [
                    {"name": "Tintos", "children": []},
                    {"name": "Blancos y Rosé", "children": []},
                    {"name": "Espumantes", "children": []},
                ],
            },
            {
                "name": "Destilados y Licores",
                "children": [
                    {"name": "Pisco", "children": []},
                    {"name": "Whisky y Ron", "children": []},
                    {"name": "Vodka y Gin", "children": []},
                    {"name": "Licores y Bajativos", "children": []},
                ],
            },
            {
                "name": "Bebidas y Mixers",
                "children": [
                    {"name": "Gaseosas", "children": []},
                    {"name": "Aguas y Tónicas", "children": []},
                    {"name": "Jugos y Energéticas", "children": []},
                ],
            },
            {
                "name": "Complementos y Snacks",
                "children": [
                    {"name": "Hielo y Vasos", "children": []},
                    {"name": "Tabaco y Accesorios", "children": []},
                    {"name": "Picoteo y Snacks", "children": []},
                ],
            },
        ),
    ),
    BusinessTemplateCode.COMERCIO_GENERAL: TemplateDefinition(
        code=BusinessTemplateCode.COMERCIO_GENERAL,
        title="Comercio General",
        description="Estructura flexible para vendedores independientes y rubros generales.",
        tree=(
            {
                "name": "Productos Principales",
                "children": [
                    {"name": "Línea Base", "children": []},
                    {"name": "Novedades", "children": []},
                    {"name": "Promociones", "children": []},
                ],
            },
            {
                "name": "Accesorios y Complementos",
                "children": [
                    {"name": "Uso Diario", "children": []},
                    {"name": "Repuestos e Insumos", "children": []},
                ],
            },
            {
                "name": "Temporada y Especiales",
                "children": [
                    {"name": "Ofertas", "children": []},
                    {"name": "Edición Limitada", "children": []},
                ],
            },
        ),
    ),
}
