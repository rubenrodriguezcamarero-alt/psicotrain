// Listados de estaciones de cada línea, copiados tal cual de los listados que envía el usuario.
// Cada línea: estaciones en orden de una cabecera a la otra. Si una línea tiene ramales,
// cada ramal va en su propio tramo (lista). Las líneas sin listado aún tienen tramos vacíos.
const LINEAS = [
  { id: 'l1', nombre: 'Línea 1', color: '#38a3dc', circular: false, tramos: [] },
  { id: 'l2', nombre: 'Línea 2', color: '#e3001b', circular: false, tramos: [] },
  { id: 'l3', nombre: 'Línea 3', color: '#f5c400', circular: false, tramos: [] },
  { id: 'l4', nombre: 'Línea 4', color: '#a0522d', circular: false, tramos: [] },
  { id: 'l5', nombre: 'Línea 5', color: '#8fbf26', circular: false, tramos: [] },
  { id: 'l6', nombre: 'Línea 6', color: '#8c8c8c', circular: false, tramos: [] },
  { id: 'l7', nombre: 'Línea 7', color: '#f39200', circular: false, tramos: [] },
  { id: 'l8', nombre: 'Línea 8', color: '#ec82b1', circular: false, tramos: [] },
  { id: 'l9', nombre: 'Línea 9', color: '#a3238e', circular: false, tramos: [] },
  { id: 'l10', nombre: 'Línea 10', color: '#00539f', circular: false, tramos: [] },
  { id: 'l11', nombre: 'Línea 11', color: '#0b8c3c', circular: false, tramos: [] },
  { id: 'l12', nombre: 'Línea 12', color: '#a49a00', circular: false, tramos: [] },
  { id: 'ml', nombre: 'Metro Ligero', color: '#4fb3e0', circular: false, tramos: [] },
];
