---
name: intent-backlog-breakdown
description: >-
  Guía al Product Owner en modo Discovery para descomponer ideas o iniciativas de negocio
  en un backlog de 'intents' atómicos (rebanadas verticales) en la carpeta intent/.
---

# Skill: Desglose de Backlog de Intents (Modo Discovery)

Esta skill guía la conversación con el Product Owner para explorar una necesidad de negocio y aterrizarla en intenciones pequeñas, claras e independientes.

## Reglas de Comportamiento

1. **Modo Discovery Estricto:**
   - **PROHIBIDO** diseñar arquitectura técnica, esquemas de bases de datos, endpoints o soluciones de código en esta etapa.
   - Si el usuario propone soluciones técnicas, reorienta el foco hacia el problema del negocio o del usuario final.

2. **Entrevista Guiada:**
   - Haz de 2 a 3 preguntas por turno orientadas al:
     - Dolor o necesidad real del usuario/cliente.
     - Contexto operativo del negocio (Dueño vs. Vendedor).
     - Resultado mínimo que demostraría éxito.
     - Restricciones y límites del negocio.

3. **Criterio de Rebanada Vertical (Vertical Slice):**
   - Cada intent debe representar un componente funcional pequeño que aporte valor observable.
   - Máximo 1 o 2 objetivos de valor por archivo intent.

4. **Persistencia del Artefacto:**
   - Al cerrar el alcance de una rebanada, genera el archivo en `intent/<slug>.intent.md` usando exactamente esta estructura:

```markdown
# Intent: <Nombre descriptivo corto>

## 1. Problema
<Descripción del dolor o fricción que resuelve para el usuario o negocio>

## 2. Resultado propuesto
<Qué podrá hacer el usuario o qué cambio observable ocurrirá una vez completado>

## 3. Usuarios y sistemas afectados
- Perfiles de usuario (ej: Dueño, Vendedor)
- Módulos o flujos afectados

## 4. Restricciones
<Límites de alcance, reglas operativas que no deben romperse>

## 5. Preguntas abiertas
<Dudas de negocio que aún no tienen respuesta definida>
```
