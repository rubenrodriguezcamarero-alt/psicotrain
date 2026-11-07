"""Junta las preguntas de temario/src/<tema>_*.json en temario/datos.js para la app.

Cada pregunta: [enunciado, correcta, incorrecta1, incorrecta2, referencia, cita literal del PDF].
"""
import glob, json, os

TEMAS = [
    # id, número, nombre (como en el título del PDF), emoji, color 1, color 2
    ('t1', 1, 'Conocimientos sobre Metro', '🚇', '#e3001b', '#1d4fb5'),
    ('t2', 2, 'NISARC', '📕', '#dc2626', '#7c2d12'),
    ('t3', 3, 'NIC', '📘', '#2563eb', '#0f766e'),
    ('t4', 4, 'Reglamento de Viajeros Metro de Madrid', '📜', '#9333ea', '#db2777'),
    ('t5', 5, 'Código Ético Metro de Madrid', '🧭', '#0891b2', '#4f46e5'),
    ('t6', 6, 'PRL', '🦺', '#ea580c', '#ca8a04'),
    ('t7', 7, 'Conocimientos generales CRMT', '🏛️', '#16a34a', '#0e7490'),
]
base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
meta, preguntas = [], {}
for tid, num, nombre, em, c1, c2 in TEMAS:
    qs = []
    for f in sorted(glob.glob(os.path.join(base, 'temario', 'src', f'{tid}_*.json'))):
        qs += json.load(open(f, encoding='utf8'))
    preguntas[tid] = qs
    meta.append({'id': tid, 'num': num, 'name': nombre, 'em': em, 'c1': c1, 'c2': c2, 'n': len(qs)})
out = ('// Generado por tools/build_temario.py: no editar a mano.\n'
       'const TEMARIO = ' + json.dumps({'temas': meta, 'preguntas': preguntas}, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(base, 'temario', 'datos.js'), 'w', encoding='utf8').write(out)
print({m['name']: m['n'] for m in meta}, f'{len(out) / 1024:.0f} KB')
