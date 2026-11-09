# [Módulo 1] Simplificación Inteligente del Mantenedor de Inventario

El **Caso de Uso 1: Mantenedor de Inventario y Clasificación (CU-001)** debe ser mejorado para que un pequeño empresario que no es experto en gestión de inventario pueda administrar su catálogo de manera intuitiva y rápida.

A continuación, se describen las mejoras sugeridas para simplificar las funcionalidades del **Mantenedor de Inventario** para el usuario novato, manteniendo las capacidades complejas subyacentes (como la anidación y las alertas de stock):

---

## CU-001 MEJORADO: MANTENEDOR DE INVENTARIO SIMPLIFICADO

El objetivo central sigue siendo permitir al Administrador **crear y organizar el catálogo de productos** según su tipo de negocio, pero minimizando la jerga técnica.

### I. Flujo de Eventos (Normal) Simplificado: Clasificación y Producto

#### 1. Priorización de la Carga Rápida (Catálogos Prediseñados)
Para un usuario que necesita empezar rápido, el paso más amigable es la **carga automática de datos**.

| Funcionalidad Original | Mejora de Usabilidad (Amigable) | Soporte en Fuentes |
| :--- | :--- | :--- |
| **Paso 1:** Ingreso manual al módulo. | **Wizard de Inicio Rápido:** Al acceder por primera vez al mantenedor, el sistema debe preguntar: **"¿Qué tipo de negocio tienes?"** (Almacén, Farmacia, Botillería, etc.). | La solución **Gestión POS** ya está segmentada para negocios como Almacenes, Farmacias y Botillerías. |
| **Paso 2:** Búsqueda en catálogos prediseñados (*eleventa presto*). | **Búsqueda Universal (Escaneo y Carga):** Se simplifica el proceso de **Consulta de Productos**. El usuario solo escanea el código de barras o escribe el nombre del producto. El sistema, con su base de datos de **más de 170,000 artículos**, carga automáticamente: **la descripción, el código de barras y la clave de unidad de medida**. Esto **ahorra tiempo en la captura manual**. | La funcionalidad similar a **eleventa presto** está disponible con más de 170.000 productos y códigos de barras, eliminando la necesidad de capturar manualmente la información. |
| **Paso 3:** Importación Masiva por Excel/CSV. | **Plantillas Dirigidas:** Si el usuario elige la importación masiva, el sistema debe ofrecer plantillas de Excel/CSV ya estructuradas para su tipo de negocio (ej. Botillería), con los campos relevantes pre-nombrados (Tipo, Marca, Contenido), facilitando la carga de **descripción, costos, precios, inventario mínimo y máximo**. | Los sistemas de inventario deben permitir la carga masiva mediante archivos Excel/CSV para inicializar rápidamente el inventario. |

---

#### 2. Simplificación de la Clasificación Anidada
La solicitud de **clasificación anidada a gusto del usuario** (Bebidas -> Tipo -> Marca -> Volumen) es flexible, pero técnicamente compleja. La simplificación debe guiar al usuario a través de la creación de **Atributos Personalizados**.

| Funcionalidad Original | Mejora de Usabilidad (Amigable) | Soporte en Fuentes |
| :--- | :--- | :--- |
| **Departamentos y Atributos/Anidación:** Requiere definir jerarquías complejas. | **Clasificación Guiada:** El sistema guía la creación de clasificación con preguntas sencillas: **"¿Qué grupos de productos vendes?"** (Departamentos). Luego, si el producto tiene variaciones, se pregunta: **"¿Este producto viene en diferentes tamaños, sabores o colores?"** para crear **atributos personalizados** (como lo hacen ATUM y WP Inventory Manager). | La capacidad de crear una jerarquía a gusto del usuario es una característica de **sistemas altamente personalizables**, y debe usar **atributos personalizados** y **variaciones de productos** para manejar el inventario detallado. |
| **Creación de Producto Único (SKU) y Asignación de Atributos.** | **Vista de Variaciones:** Cuando se asignan atributos, el sistema debe generar automáticamente una lista de todas las combinaciones posibles (ej. Vino tinto - 750ml - Cosecha 2022) y permitir al usuario definir el stock para cada una, facilitando la gestión de inventario para estas **variaciones**. | Plugins como **ATUM WooCommerce Inventory Management** están diseñados para gestionar los niveles de inventario de estas variaciones. |

---

#### 3. Simplificación de la Configuración del Producto y Stock
El usuario novato no necesariamente sabe de **Costo Promedio Ponderado** o **Punto de Reorden**.

| Funcionalidad Original | Mejora de Usabilidad (Amigable) | Soporte en Fuentes |
| :--- | :--- | :--- |
| **Cálculo de Costos:** Manejar la opción de calcular por **Costo Promedio Ponderado** o **Último Costo**. | **Cálculo de Costo por Defecto:** El sistema debe usar un método por defecto (ej. Último Costo) y solo exponer la opción de cambiar a Costo Promedio Ponderado en una sección avanzada, si el usuario lo requiere. El Administrador **captura el Precio Costo y el Precio de Venta**. | La definición de Costo y Precio de Venta es esencial. La elección del método de cálculo de costo es una complejidad técnica. |
| **Existencias Iniciales:** Definir el **Inventario Mínimo (punto de reorden)** y el **Inventario Máximo**. | **Gestión de Riesgo Visual:** Se elimina el término "Punto de Reorden". Se reemplaza con una barra deslizadora o un campo sencillo que pregunte: **"¿Cuántas unidades necesitas tener en stock para no quedarte sin mercancía (mínimo)?"**. El sistema debe utilizar este **Inventario Mínimo** para generar **Alertas de bajo stock** o **Compras Sugeridas**. | El establecimiento de Inventario Mínimo y Máximo es un parámetro clave para el seguimiento y la generación de alertas de bajo stock y compras sugeridas. |
| **Tipo de Venta:** Definir si es por Unidad, A Granel o Paquete/Kit. | **Etiquetado Simple:** La opción debe ser visible y simple, permitiendo marcar productos como **"Se vende por peso/medida (usa decimales)"** o **"Es un kit (descuenta varios componentes)"**. | La definición de cómo se vende el producto (Unidad/Pieza, A Granel, Paquete/Kit) es crucial, especialmente para que el **Kit** descuente automáticamente sus componentes del inventario. |

---

### II. Flujo de Eventos (Alternativo B) Simplificado: Ajustes y Edición
La edición masiva y los ajustes de inventario deben ser simples para corregir las discrepancias que son un **problema peligroso** para el negocio.

| Funcionalidad Original | Mejora de Usabilidad (Amigable) | Soporte en Fuentes |
| :--- | :--- | :--- |
| **Actualización Masiva:** Usar un **Actualizador Masivo** para cambiar inventario o clasificación. | **Edición Rápida en Tabla (Similar a Excel):** En lugar de un actualizador masivo complejo, se utiliza una interfaz de tabla editable (como **Smart Manager**) que permite seleccionar múltiples productos y modificar sus campos (existencia, costo, clasificación) directamente, facilitando el cambio masivo del **Departamento** o los **ajustes masivos de inventario**. | La edición masiva es reconocida en sistemas como **Smart Manager**. Los usuarios pueden seleccionar productos por filtro o manualmente para realizar acciones masivas. |
| **Ajustes de Inventario por Mermas/Discrepancias:** Requiere registrar el código, la cantidad (+/-) y el motivo. | **Módulo de Conteo Físico Guiado:** Se crea un módulo separado llamado **"Corregir Inventario Físico"**. El sistema solicita al usuario contar y registrar la cantidad real. El sistema calcula automáticamente la diferencia (la **discrepancia** peligrosa). El usuario solo debe ingresar el **motivo del ajuste** (merma, robo, error de conteo). | El proceso requiere registrar el código del producto, la cantidad a sumar o restar y el motivo del ajuste. |

---

> **Filosofía Clave:** Para simplificar la gestión de inventario para un pequeño empresario, piense en el sistema como un **asistente de almacén virtual**. En lugar de pedirle al dueño que aprenda términos de contabilidad (como "Punto de Reorden" o "Costo Promedio Ponderado"), el asistente le pregunta en lenguaje cotidiano qué necesita (ej. "¿Cuánto stock es tu límite de seguridad?") y luego maneja automáticamente las complejas operaciones internas (como las alertas de bajo stock o el cálculo del costo).
