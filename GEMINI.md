# Reglas del Proyecto - SaaS Pequeños Negocios (AI-Native SDLC)

## 1. Modelo de IA por Defecto
- **Modelo Designado:** **Gemini 4 Argon (Argon)**.
- Todas las etapas de razonamiento arquitectónico, análisis de negocio, redacción de especificaciones técnicas y generación de código deben ejecutarse con este modelo.

---

## 2. Flujo de Trabajo y Cadena de Artefactos
El desarrollo se rige por rebanadas funcionales pequeñas (*Vertical Slices*) siguiendo la regla: **"Una sesión de agente = Una rebanada vertical"**.

Ningún desarrollo de código comienza sin atravesar el ciclo de artefactos versionados en Git:
$$\text{intent.md} \longrightarrow \text{spec.md} \longrightarrow \text{plan.md} \longrightarrow \text{código y tests}$$

---

## 3. Responsabilidades por Etapa

### Etapa 1: Discovery y Desglose (`intent/`)
- **Skill:** `intent-backlog-breakdown`
- **Regla estricta:** En esta etapa **está prohibido** diseñar soluciones técnicas, esquemas de bases de datos o endpoints.
- El agente entrevista al Product Owner (2-3 preguntas concretas por turno) enfocándose en el dolor del negocio, usuarios y resultado esperado.
- Cada rebanada vertical se guarda en `intent/<slug>.intent.md` con la plantilla estándar de 5 apartados:
  1. *Problema*
  2. *Resultado propuesto*
  3. *Usuarios y sistemas afectados*
  4. *Restricciones*
  5. *Preguntas abiertas*

### Etapa 2: Triaje del Product Owner
- El Product Owner humano selecciona **un único intent** del backlog para entrar en desarrollo.

### Etapa 3: Diseño Técnico (`spec/`)
- **Skill:** `spec-generator`
- A partir del `.intent.md` seleccionado, se genera automáticamente `spec/<slug>.spec.md`.
- Contenido obligatorio:
  - Criterios de aceptación verificables.
  - Casos borde y comportamiento esperado.
  - Límite estricto de alcance (máximo 3 a 5 criterios/validaciones para evitar cascada).
  - *Flagged concerns* o decisiones técnicas que requieran confirmación humana.

### Etapa 4: Plan, Construcción y Verificación (`plan/`, `src/`, `tests/`)
- **Skill:** `plan-and-implement`
- **Paso 4.1:** Generar `plan/<slug>.plan.md` detallando archivos modificados, orden de trabajo y pruebas a ejecutar.
- **Paso 4.2 (Puerta de control humana):** Detenerse y solicitar aprobación explícita del plan antes de modificar o crear archivos en `src/`.
- **Paso 4.3 (TDD):** Escribir primero las pruebas en `tests/` que verifiquen los criterios de aceptación (rojo), luego el código mínimo en `src/` (verde), y refactorizar.
- **Paso 4.4:** Ejecutar la suite de pruebas localmente. No dar la tarea por completada hasta que todos los tests estén pasando al 100%.

---

## 4. Stack Tecnológico de Referencia
- **Backend API & Core:** Python 3.12+, FastAPI, Pydantic v2 (tipado estricto), SQLAlchemy / SQLModel.
- **Frontend Web:** React / Next.js con contratos OpenAPI sincronizados vía Orval + TanStack Query.
- **Agentes e IA:** Antigravity SDK en Python con Gemini 4 Argon.
