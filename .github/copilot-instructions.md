# Copilot Instructions - Frontend

Scope: This repository only (my-dashboard-frontend).

## Stack
- React 18 and Vite.

## Rules
- Use functional components and hooks.
- Keep API access in src/api; do not call fetch directly in view components.
- Build reusable UI in src/components/ui and keep styling consistent.
- Include clear loading and error states plus accessibility basics.

## Quality
- Run build after UI or API wiring changes: npm run build.
- Keep component changes minimal and avoid unrelated refactors.
