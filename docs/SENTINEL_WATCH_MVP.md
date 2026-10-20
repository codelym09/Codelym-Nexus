# Sentinel Watch — MVP de interfaz

## Estado

Primera entrega navegable basada exclusivamente en datos simulados. La pantalla está integrada en el control plane existente en la ruta protegida `/sentinel`.

## Incluido

- Panel de estado con objetivos activos, alertas abiertas, confianza media y latencia simulada.
- Vista 2D esquemática con cuadrícula, radios, puesto propio, objetivos seleccionables y trayectorias estimadas.
- Vista 3D de demostración con plano de elevación relativa y objetivos seleccionables.
- Centro de alertas con filtros por prioridad y confirmación manual de eventos.
- Panel de detalle de objetivo con altitud, velocidad, rumbo, confianza, calidad y antigüedad del dato.
- Tabla de observaciones recientes con procedencia visible.
- Etiquetas persistentes `SIMULADO` y aviso de que una trayectoria estimada no es una posición confirmada.
- Escenario reproducible en cliente con opción de pausar y reanudar.
- Diseño adaptable para escritorio, tablet y móvil.

## Archivos principales

- `control-plane/client/src/pages/SentinelWatch.tsx`: datos simulados, interacciones y composición de la pantalla.
- `control-plane/client/src/index.css`: sistema visual de la consola, mapa esquemático, escena 3D y responsive.
- `control-plane/client/src/App.tsx`: ruta `/sentinel`.
- `control-plane/client/src/components/DashboardLayout.tsx`: entrada de navegación.
- `control-plane/client/public/manus-routes.json`: manifiesto actualizado.

## Validación ejecutada

```bash
cd control-plane
pnpm check
pnpm build
curl http://127.0.0.1:3000/manus-routes.json
curl -I http://127.0.0.1:3000/sentinel
```

El chequeo TypeScript y el build pasan. La ruta devuelve `HTTP 200` y el manifiesto incluye `/sentinel`.

## No incluido todavía

Esta entrega no conecta sensores, no hace detección física, no expone una API de observaciones, no persiste datos y no implementa capacidades de interferencia, control o neutralización. Antes de integrar fuentes reales se requieren los contratos de adaptadores, autenticación por roles, auditoría persistente, pruebas de seguridad, cifrado y evaluación legal/técnica independiente descritos en el blueprint.
