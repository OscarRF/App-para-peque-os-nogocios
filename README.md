# SaaS para Pequeños Negocios

Plataforma modular para la digitalización y gestión ágil de inventarios, compras y ventas para pequeños comercios y negocios locales.

Desarrollado bajo el paradigma **AI-Native SDLC** con **Google Antigravity** y **Gemini 4 Argon**.

---

## 🏗️ Arquitectura y Stack Tecnológico

- **Backend API & Core:** Python 3.12+, FastAPI, Pydantic v2 (tipado estricto) y SQLAlchemy / SQLModel.
- **Frontend Web:** React / Next.js con clientes OpenAPI autogenerados (Orval + TanStack Query).
- **Flujo Agéntico & IA:** Google Antigravity SDK con el modelo **Gemini 4 Argon**.

---

## 📁 Estructura del Repositorio

El proyecto se desarrolla mediante **rebanadas verticales (*vertical slices*)** siguiendo el ciclo estricto de artefactos:

```text
├── .agents/                 # Skills y configuraciones para agentes Antigravity
│   └── skills/
│       ├── intent-backlog-breakdown/   # Modo Discovery para el PO
│       ├── spec-generator/             # Diseño de especificaciones técnicas
│       └── plan-and-implement/         # Planes y desarrollo guiado por tests (TDD)
├── intent/                  # Backlog de intenciones de negocio (*.intent.md)
├── spec/                    # Especificaciones técnicas formales (*.spec.md)
├── plan/                    # Planes de implementación detallados (*.plan.md)
├── src/                     # Código fuente de la aplicación (Backend & Frontend)
├── tests/                   # Pruebas automatizadas (unitarias, integración)
├── Estudio inicial/         # Cuaderno de investigación funcional y UX/UI
├── Stack Tecnologico/       # Documentos de arquitectura y SDLC
├── GEMINI.md                # Reglas del proyecto y configuración de IA
└── .gitignore               # Configuración de exclusiones Git
```

---

## 🔄 Ciclo de Desarrollo (AI-Native SDLC)

1. **Discovery (`intent/`):** Desglose de necesidades con el Product Owner en rebanadas atómicas.
2. **Triaje:** Selección de un único intent por sesión de desarrollo.
3. **Design (`spec/`):** Generación de especificación técnica con criterios de aceptación y casos borde.
4. **Build & Test (`plan/`, `src/`, `tests/`):** Plan detallado $\to$ Aprobación humana $\to$ TDD (tests en rojo $\to$ verde $\to$ refactor).
