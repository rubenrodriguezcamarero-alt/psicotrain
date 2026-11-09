// Listados de estaciones de cada línea, copiados de los planos oficiales que envía el usuario
// (Plano-linea-N-Metro-Madrid.svg). corr = correspondencias que el plano marca bajo cada estación
// (l1…l12 = líneas de Metro, ml1 = Metro Ligero 1, r = Ramal). Solo se corrigieron erratas evidentes
// de los planos: «VIllaverde Alto», «Cuatro caminos», «Las suertes», «Piramides», «Emplame».
// Cada línea: estaciones en orden de una cabecera a la otra. Si una línea tiene ramales,
// cada ramal va en su propio tramo (lista). Las líneas sin listado aún tienen tramos vacíos.
const LINEAS = [
  { id: 'l1', nombre: 'Línea 1', color: '#38a3dc', circular: false, 
    tramos: [["Pinar de Chamartín", "Bambú", "Chamartín", "Plaza Castilla", "Valdeacederas", "Tetuán", "Estrecho", "Alvarado", "Cuatro Caminos", "Ríos Rosas", "Iglesia", "Bilbao", "Tribunal", "Gran Vía", "Sol", "Tirso de Molina", "Antón Martín", "Estación del Arte", "Atocha–Renfe", "Menéndez Pelayo", "Pacífico", "Puente de Vallecas", "Nueva Numancia", "Portazgo", "Buenos Aires", "Alto del Arenal", "Miguel Hernández", "Sierra de Guadalupe", "Villa de Vallecas", "Congosto", "La Gavia", "Las Suertes", "Valdecarros"]],
    corr: {"Pinar de Chamartín": ["l4", "ml1"], "Chamartín": ["l10"], "Plaza Castilla": ["l9", "l10"], "Cuatro Caminos": ["l2", "l6"], "Bilbao": ["l4"], "Tribunal": ["l10"], "Gran Vía": ["l5"], "Sol": ["l2", "l3"], "Pacífico": ["l6"]} },
  { id: 'l2', nombre: 'Línea 2', color: '#e3001b', circular: false, 
    tramos: [["Las Rosas", "Avenida de Guadalajara", "Alsacia", "La Almudena", "La Elipa", "Ventas", "Manuel Becerra", "Goya", "Príncipe Vergara", "Retiro", "Banco de España", "Sevilla", "Sol", "Ópera", "Santo Domingo", "Noviciado", "San Bernardo", "Quevedo", "Canal", "Cuatro Caminos"]],
    corr: {"Ventas": ["l5"], "Manuel Becerra": ["l6"], "Goya": ["l4"], "Príncipe Vergara": ["l9"], "Sol": ["l1", "l3"], "Ópera": ["l5", "r"], "Noviciado": ["l3", "l10"], "San Bernardo": ["l4"], "Canal": ["l7"], "Cuatro Caminos": ["l1", "l6"]} },
  { id: 'l3', nombre: 'Línea 3', color: '#f5c400', circular: false, 
    tramos: [["Villaverde Alto", "San Cristóbal", "Villaverde Bajo-Cruce", "Ciudad de los Ángeles", "San Fermín-Orcasur", "Hospital 12 de Octubre", "Almendrales", "Legazpi", "Delicias", "Palos de la Frontera", "Embajadores", "Lavapiés", "Sol", "Callao", "Plaza de España", "Ventura Rodríguez", "Argüelles", "Moncloa"]],
    corr: {"Legazpi": ["l6"], "Embajadores": ["l5"], "Sol": ["l1", "l2"], "Callao": ["l5"], "Plaza de España": ["l2", "l10"], "Argüelles": ["l4", "l6"], "Moncloa": ["l6"]} },
  { id: 'l4', nombre: 'Línea 4', color: '#a0522d', circular: false, 
    tramos: [["Argüelles", "San Bernardo", "Bilbao", "Alonso Martínez", "Colón", "Serrano", "Velázquez", "Goya", "Lista", "Diego de León", "Avenida de América", "Prosperidad", "Alfonso XIII", "Avenida de La Paz", "Arturo Soria", "Esperanza", "Canillas", "Mar de Cristal", "San Lorenzo", "Parque de Santa María", "Hortaleza", "Manoteras", "Pinar de Chamartín"]],
    corr: {"Argüelles": ["l3", "l6"], "San Bernardo": ["l2"], "Bilbao": ["l1"], "Alonso Martínez": ["l5", "l10"], "Goya": ["l2"], "Diego de León": ["l5", "l6"], "Avenida de América": ["l6", "l7", "l9"], "Mar de Cristal": ["l8"], "Pinar de Chamartín": ["l1", "ml1"]} },
  { id: 'l5', nombre: 'Línea 5', color: '#8fbf26', circular: false, 
    tramos: [["Alameda de Osuna", "El Capricho", "Canillejas", "Torre Arias", "Suanzes", "Ciudad Lineal", "Pueblo Nuevo", "Quintana", "El Carmen", "Ventas", "Diego de León", "Núñez de Balboa", "Rubén Darío", "Alonso Martínez", "Chueca", "Gran Vía", "Callao", "Ópera", "La Latina", "Puerta de Toledo", "Acacias", "Pirámides", "Marqués de Vadillo", "Urgel", "Oporto", "Vista Alegre", "Carabanchel", "Eugenia de Montijo", "Aluche", "Empalme", "Campamento", "Casa de Campo"]],
    corr: {"Pueblo Nuevo": ["l7"], "Ventas": ["l2"], "Diego de León": ["l4", "l6"], "Núñez de Balboa": ["l9"], "Alonso Martínez": ["l4", "l10"], "Gran Vía": ["l1"], "Callao": ["l3"], "Ópera": ["l2", "r"], "Acacias": ["l3"], "Oporto": ["l6"], "Casa de Campo": ["l10"]} },
  { id: 'l6', nombre: 'Línea 6', color: '#8c8c8c', circular: false, tramos: [] },
  { id: 'l7', nombre: 'Línea 7', color: '#f39200', circular: false, tramos: [] },
  { id: 'l8', nombre: 'Línea 8', color: '#ec82b1', circular: false, tramos: [] },
  { id: 'l9', nombre: 'Línea 9', color: '#a3238e', circular: false, tramos: [] },
  { id: 'l10', nombre: 'Línea 10', color: '#00539f', circular: false, tramos: [] },
  { id: 'l11', nombre: 'Línea 11', color: '#0b8c3c', circular: false, tramos: [] },
  { id: 'l12', nombre: 'Línea 12', color: '#a49a00', circular: false, tramos: [] },
  { id: 'ml', nombre: 'Metro Ligero', color: '#4fb3e0', circular: false, tramos: [] },
];
