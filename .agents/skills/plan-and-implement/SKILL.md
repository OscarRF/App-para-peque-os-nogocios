---
name: plan-and-implement
description: >-
  Genera un plan de implementación técnica a partir de una spec, espera la aprobación
  humana obligatoria, y ejecuta la codificación guiada por pruebas (TDD).
---

# Skill: Planificación e Implementación Guiada por Pruebas (Build & Test)

Esta skill ejecuta la fase de construcción asegurando que no se escriba código sin un plan aprobado y que toda funcionalidad esté respaldada por pruebas automatizadas que pasen en verde.

## Procedimiento Paso a Paso

### Paso 1: Generación del Plan (`plan/<slug>.plan.md`)
1. Lee `spec/<slug>.spec.md`.
2. Analiza los archivos existentes en `src/` y `tests/`.
3. Redacta el plan de ejecución en `plan/<slug>.plan.md` con:
   - **Archivos a crear o modificar:** Lista exacta de rutas.
   - **Estrategia de pruebas:** Qué pruebas se crearán en `tests/` para verificar cada criterio de aceptación.
   - **Orden de tareas:** Secuencia de pasos paso a paso.
   - **Riesgos y mitigaciones.**

### Paso 2: Puerta de Control Humana (Gate Obligatorio)
- **ALTO:** El agente se detiene aquí y solicita al usuario revisión y aprobación explícita del plan.
- **PROHIBIDO modificar código en `src/` antes de recibir la confirmación humana.**

### Paso 3: Implementación con TDD (Test-Driven Development)
Una vez aprobado el plan:
1. **Rojo:** Escribir las pruebas automatizadas en `tests/` que verifiquen los criterios de aceptación de la spec.
2. **Verde:** Implementar el código mínimo y necesario en `src/` para hacer pasar las pruebas.
3. **Refactor:** Mejorar la legibilidad, tipado estricto (Pydantic) y modularidad sin romper las pruebas.

### Paso 4: Verificación
1. Ejecutar la suite de pruebas localmente.
2. Confirmar que todos los tests estén pasando al 100%.
3. Registrar la finalización del slice y preparar el commit de Git.
