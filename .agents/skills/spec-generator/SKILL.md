---
name: spec-generator
description: >-
  Convierte un archivo de intención (intent/<nombre>.intent.md) aprobado por el PO
  en una especificación técnica formal en spec/<nombre>.spec.md.
---

# Skill: Generador de Especificaciones Técnicas (Design)

Esta skill toma un intent priorizado y produce su correspondiente especificación técnica, definiendo con exactitud el comportamiento, contratos y criterios de validación.

## Reglas de Comportamiento

1. **Lectura del Intent:**
   - Lee el archivo `intent/<slug>.intent.md` especificado.
   - Si quedan preguntas abiertas críticas de negocio, solicita resolución antes de continuar.

2. **Alineación con el Stack Tecnológico:**
   - Aplica los estándares definidos en `GEMINI.md` y la arquitectura del proyecto:
     - Backend: Python 3.12+, FastAPI, Pydantic v2 (modelos estrictos).
     - Frontend: React / Next.js con contratos OpenAPI vía Orval.
     - Pruebas: Pytest / Vitest.

3. **Límite Estricto de Alcance (Anti-Cascada):**
   - No más de 3 a 5 criterios de aceptación clave por spec.
   - Si la necesidad resulta demasiado amplia, recomienda al PO dividir el intent en dos rebanadas más pequeñas.

4. **Persistencia del Artefacto:**
   - Guarda el resultado en `spec/<slug>.spec.md` con la siguiente estructura:

```markdown
# Spec: <Nombre del Intent>
**Intent de origen:** [intent/<slug>.intent.md](../intent/<slug>.intent.md)

## 1. Resumen y Alcance
<Breve descripción técnica de lo que se implementará y lo que queda expresamente fuera>

## 2. Criterios de Aceptación (Gherkin o Verificables)
- [ ] Escenario 1: Dado... Cuando... Entonces...
- [ ] Escenario 2: Dado... Cuando... Entonces...

## 3. Contratos de Datos y Modelos (Pydantic / OpenAPI)
<Esquemas de entrada y salida esperados>

## 4. Casos Borde y Manejo de Errores
- Comportamiento ante datos inválidos, duplicados o estados inesperados.

## 5. Decisiones Técnicas y Preocupaciones (Flagged Concerns)
<Puntos que requieran validación arquitectónica del equipo>
```
