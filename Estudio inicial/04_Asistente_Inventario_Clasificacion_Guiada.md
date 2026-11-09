# [Gestión de Inventario] Asistente de Inventario y Clasificación Guiada

Este documento consolida la descripción de funcionalidades para el **Caso de Uso 1: Mantenedor de Inventario**, integrando los lineamientos de diseño de casos de uso UML, y aplicando las mejoras de usabilidad solicitadas para simplificar la gestión para un pequeño empresario que no es experto en inventario.

El sistema está diseñado para actuar como un **asistente de almacén virtual**, que utiliza lenguaje cotidiano en lugar de jerga técnica compleja (como "Punto de Reorden" o "Costo Promedio Ponderado").

---

## CASO DE USO 1: MANTENEDOR DE INVENTARIO Y CLASIFICACIÓN (CU-001 MEJORADO)

| Campo | Descripción Detallada |
| :--- | :--- |
| **Nombre del Caso de Uso** | Mantenedor de Inventario y Clasificación (CU-001) |
| **Actor Principal** | Administrador del sistema / Dueño del negocio |
| **Objetivo** | El Administrador desea **crear y organizar el catálogo de productos** según su tipo de negocio, permitiendo una clasificación altamente **personalizable y anidada** para facilitar la administración del stock, minimizando la jerga técnica. |
| **Precondiciones** | 1. El módulo de control de inventario está instalado y activado. <br>2. El Administrador ha iniciado sesión con permisos para crear y modificar productos (F3 Productos) e inventarios (F4 Inventario). |
| **Garantía de Éxito (Postcondición)** | El catálogo de productos está actualizado, los artículos están asociados a una estructura de clasificación definida por el usuario, y se han establecido los parámetros clave de inventario (existencia, mínimo y máximo) para el seguimiento. |

---

### I. Flujo de Eventos (Normal) Simplificado: Clasificación y Producto

#### 1. Definición y Clasificación Guiada
El sistema facilita la estructuración del catálogo, guiando al Administrador a través de la clasificación y la carga de datos:

1. **Ingreso y Asistente de Inicio Rápido:** El Administrador accede al módulo de productos (F3 Productos). Al acceder al mantenedor por primera vez, el sistema activa un **Wizard de Inicio Rápido** que pregunta: **"¿Qué tipo de negocio tienes?"** (ej. Almacén, Farmacia, Botillería, etc.), ya que la lógica de software puede estar segmentada para estos giros.
2. **Clasificación Guiada (Departamentos):** El sistema guía la creación de clasificación con la pregunta sencilla: **"¿Qué grupos de productos vendes?"** (Departamentos). Estos Departamentos se usan para filtrar reportes y catálogos.
3. **Configuración de Atributos/Variaciones:** El sistema pregunta: **"¿Este producto viene en diferentes tamaños, sabores o colores?"** para crear **atributos personalizados** (ej. "Marca", "Contenido en cc"). Esta capacidad de crear jerarquías a gusto del usuario es clave y se maneja mediante atributos personalizados que se integran con la gestión de **variaciones de productos**.
4. **Creación de Producto Único (SKU):** El Administrador registra un producto nuevo.
5. **Vista de Variaciones:** Al asignar atributos, el sistema debe generar automáticamente una lista de todas las combinaciones posibles (ej. Vino tinto - 750ml) y permitir al usuario definir el stock para cada una, facilitando la gestión de inventario para estas **variaciones**.

#### 2. Configuración del Producto (Esenciales para Inventario)
1. **Tipo de Venta (Etiquetado Simple):** El Administrador define cómo se vende el producto con opciones de **etiquetado simple**: **Por Unidad/Pieza**, **"Se vende por peso/medida (usa decimales)"**, o **"Es un kit (descuenta varios componentes)"** (que descuenta componentes del inventario de forma automática).
2. **Costos y Precios:** El Administrador captura el **Precio Costo** y el **Precio de Venta**. El sistema debe usar un método de cálculo de costo por defecto (ej. Último Costo), y solo exponer la opción de cambiar a **Costo Promedio Ponderado** en una sección avanzada.
3. **Existencias Iniciales (Gestión de Riesgo Visual):** El Administrador marca la opción "Este producto SÍ utiliza inventario".
   * Ingresa la **Existencia Actual**.
   * Se elimina el término "Punto de Reorden". En su lugar, el sistema pregunta: **"¿Cuántas unidades necesitas tener en stock para no quedarte sin mercancía (mínimo)?"**. Este **Inventario Mínimo** se utiliza para generar **Alertas de bajo stock** o **Compras Sugeridas**.
4. **Identificadores:** Captura el **Código de Barras** y la **Clave de Unidad de Medida** (ej. KG/GR).

---

### II. Flujo de Eventos (Alternativo A: Carga Rápida o "Plantilla de Negocio")
El objetivo es permitir la inicialización rápida del inventario.

1. **Búsqueda Universal (Escaneo y Carga):** Para productos conocidos, el Administrador escanea el código de barras o escribe el nombre del producto. El sistema utiliza una base de datos de **más de 170.000 artículos** (similar a *eleventa presto*) para encontrar y cargar automáticamente **la descripción, el código de barras y la clave de unidad de medida**, **ahorrando tiempo en la captura manual**.
2. **Importación Masiva (Plantillas Dirigidas):** Si el usuario elige la importación masiva, el sistema ofrece plantillas de Excel o CSV **ya estructuradas para su tipo de negocio**. El Administrador carga la información masivamente, incluyendo clasificación (Departamentos), códigos, **inventario mínimo y máximo**, facilitando la inicialización del inventario.

---

### III. Flujo de Eventos (Alternativo B: Edición Masiva y Ajustes Simplificados)
El Administrador necesita corregir datos o modificar múltiples productos a la vez.

1. **Edición Rápida en Tabla (Similar a Excel):** En lugar de un actualizador masivo complejo, se utiliza una interfaz de tabla editable (similar a **Smart Manager**) que permite al Administrador seleccionar múltiples productos por filtro y modificar sus campos (existencia, costo, clasificación) directamente. Esto facilita el cambio masivo del **Departamento** o los **ajustes masivos de inventario**.
2. **Módulo de Conteo Físico Guiado (Corregir Inventario Físico):** Se utiliza un módulo separado llamado **"Corregir Inventario Físico"** para manejar las correcciones de inventario (por mermas, robo, o errores de conteo).
   * El sistema solicita al usuario contar y registrar la cantidad real.
   * El sistema **calcula automáticamente la diferencia** (la **discrepancia** peligrosa).
   * El usuario solo debe registrar el **motivo del ajuste** (ej. merma, robo, error de conteo).
