# [Módulo 1] Caso de Uso: Gestión Integral de Inventario y Clasificación

El Caso de Uso 1 se centra en el **Mantenedor de Inventario**, cuyo objetivo principal es proporcionar la máxima flexibilidad en la **clasificación de productos** y permitir la **carga rápida mediante plantillas** adaptadas al tipo de negocio.

A continuación, se detalla el Caso de Uso 1, siguiendo las directrices de diseño estructurado (UML):

---

## CASO DE USO 1: MANTENEDOR DE INVENTARIO

| Campo | Descripción Detallada |
| :--- | :--- |
| **Nombre del Caso de Uso** | Mantenedor de Inventario y Clasificación (CU-001) |
| **Actor Principal** | Administrador del sistema / Dueño del negocio |
| **Objetivo** | El Administrador desea **crear y organizar el catálogo de productos** según su tipo de negocio, permitiendo una clasificación altamente **personalizable y anidada** para facilitar la administración del stock, la venta y la elaboración de informes. |
| **Precondiciones** | 1. El módulo de control de inventario está instalado y activado. <br>2. El Administrador ha iniciado sesión con permisos para crear y modificar productos (F3 Productos) e inventarios (F4 Inventario). |
| **Garantía de Éxito (Postcondición)** | El catálogo de productos está actualizado, los artículos están asociados a una estructura de clasificación definida por el usuario, y se han establecido los parámetros clave de inventario (existencia, mínimo y máximo) para el seguimiento. |

---

### Flujo de Eventos (Normal)

#### 1. Definición y Clasificación Flexible (Anidada)
El sistema debe permitir al Administrador estructurar el catálogo más allá de una clasificación simple:
1. **Ingreso al Catálogo:** El Administrador accede al módulo de productos (F3 Productos).
2. **Definición de Jerarquías:** El Administrador define la estructura de clasificación principal, similar a los **Departamentos** (ej. Bebidas, Abarrotes, Ferretería). El sistema permite filtrar reportes y catálogos por estos departamentos.
3. **Configuración de Atributos/Anidación (Subcategorías):** El Administrador crea **atributos personalizados** (como "Marca", "Contenido en cc", "Tipo de Bebida", etc.) para detallar los productos.
   * *Sistemas de referencia:* La gestión de inventario para estos atributos (variaciones) es crucial y se aborda en soluciones como **ATUM Inventory Management** y **WooCommerce Stock Manager**.
4. **Creación de Producto Único (SKU):** El Administrador registra un producto nuevo.
5. **Asignación de Atributos:** Asigna el producto a su **Departamento** principal y le aplica los **atributos anidados** creados (ej. Bebida -> Marca X -> 355 ML).

#### 2. Configuración del Producto (Esenciales para Inventario)
1. **Tipo de Venta:** El Administrador define cómo se vende el producto: **Por Unidad/Pieza**, **A Granel (usa decimales)**, o **Como Paquete (Kit)** (que descuenta componentes del inventario de forma automática).
2. **Costos y Precios:** Captura el **Precio Costo** y el **Precio de Venta**. El sistema debe manejar la opción de calcular el costo del inventario por **Costo Promedio Ponderado** o **Último Costo**.
3. **Existencias Iniciales:** El Administrador marca la opción "Este producto SÍ utiliza inventario".
   * Ingresa la **Existencia Actual**.
   * Define el **Inventario Mínimo (punto de reorden)** y el **Inventario Máximo** deseado. El sistema utilizará el Inventario Mínimo para generar **Alertas de bajo stock** o **Compras Sugeridas**.
4. **Identificadores:** Captura el **Código de Barras** y la **Clave de Unidad de Medida** (ej. KG/GR).
5. **Guardado:** La información se guarda automáticamente o mediante un botón "Guardar Producto".

---

### Flujo de Eventos (Alternativo A: Carga Rápida o "Plantilla de Negocio")
El Administrador busca una forma de iniciar el inventario rápidamente según su giro (ej. Farmacia, Botillería, Almacén).

1. **Uso de Catálogos Prediseñados (Similar a eleventa presto):**
   * El Administrador busca un producto específico (ej. "Jumex Fresh Bebida Con Jugo; Conga 600ml").
   * El sistema de **Consulta de Productos** (con una base de datos de más de 180,000 artículos) encuentra la descripción detallada y el código de barras.
   * El Administrador solo ingresa el precio de costo, el precio de venta y las existencias, **ahorrando tiempo en la captura manual**.
2. **Importación Masiva (Plantilla Base):**
   * El Administrador exporta una plantilla de Excel o CSV desde el sistema.
   * El Administrador carga en el archivo la lista de productos y la clasificación que desee (Departamentos, Códigos, Inventario Mínimo/Máximo).
   * El sistema permite importar la información masivamente, actualizando los productos existentes o añadiendo nuevos, facilitando la inicialización del inventario.

---

### Flujo de Eventos (Alternativo B: Edición Masiva y Ajustes de Clasificación)
El Administrador necesita modificar múltiples productos a la vez, o corregir datos incorrectos.

1. **Actualización Masiva de Inventario/Clasificación:**
   * El Administrador accede al catálogo de productos.
   * Selecciona múltiples productos (por filtro o manualmente).
   * Utiliza el **Actualizador Masivo** para realizar acciones sobre el lote de productos seleccionados:
     * Cambiar masivamente el **Departamento** (clasificación).
     * **Aumentar o Disminuir el Inventario** (ajustes masivos).
     * Comenzar a usar inventario (para productos que antes eran ilimitados).
2. **Ajustes de Inventario por Mermas/Discrepancias:**
   * El Administrador realiza correcciones de inventario (por mermas, robo, o errores de conteo).
   * Registra el código del producto y la cantidad a sumar (+) o restar (-) en el campo de ajuste (+/-).
   * Registra el motivo del ajuste (ej. Corrección a entrada incorrecta).
   * La discrepancia entre los niveles registrados y las existencias reales es un problema peligroso que este proceso ayuda a mitigar, ya que el sistema debe detectar y permitir la corrección de errores humanos.
