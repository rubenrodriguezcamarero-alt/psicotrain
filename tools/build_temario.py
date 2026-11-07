"""Junta las preguntas de temario/src/<tema>_*.json en temario/datos.js para la app.

Cada pregunta: [enunciado, correcta, incorrecta1, incorrecta2, referencia, cita literal del PDF].

Los temas marcados como privados (manuales internos con restricciones de difusión) se leen de
temario/privado/ (ignorado por git) y van a temario/datos_privado.js, que solo se incluye en la
copia privada de claude.ai, nunca en la app pública de GitHub.
"""
import glob, json, os

# Todo el temario es el oficial que Metro publica para que lo descarguen los aspirantes:
# no queda ningún tema reservado a la copia privada.
PRIVADOS = set()

TEMAS = [
    # id, número, nombre (como en el título del PDF), emoji, color 1, color 2
    ('t1', 1, 'Conocimientos sobre Metro', '🚇', '#e3001b', '#1d4fb5'),
    ('t2', 2, 'Normas Internas Seguridad Agentes', '📕', '#dc2626', '#7c2d12'),
    ('t3', 3, 'NIC', '📘', '#2563eb', '#0f766e'),
    ('t4', 4, 'Reglamento de Viajeros Metro de Madrid', '📜', '#9333ea', '#db2777'),
    ('t5', 5, 'Código Ético Metro de Madrid', '🧭', '#0891b2', '#4f46e5'),
    ('t6', 6, 'PRL', '🦺', '#ea580c', '#ca8a04'),
    ('t7', 7, 'Conocimientos generales CRMT', '🏛️', '#16a34a', '#0e7490'),
]
base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def leer(carpeta, tid):
    qs = []
    for f in sorted(glob.glob(os.path.join(base, 'temario', carpeta, f'{tid}_*.json'))):
        qs += json.load(open(f, encoding='utf8'))
    return qs

meta, preguntas, privadas = [], {}, {}
for tid, num, nombre, em, c1, c2 in TEMAS:
    priv = tid in PRIVADOS
    if priv:
        preguntas[tid] = []
        privadas[tid] = leer('privado', tid)
    else:
        preguntas[tid] = leer('src', tid)
    meta.append({'id': tid, 'num': num, 'name': nombre, 'em': em, 'c1': c1, 'c2': c2,
                 'n': len(preguntas[tid]), 'privado': priv})
dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
out = '// Generado por tools/build_temario.py: no editar a mano.\nconst TEMARIO = ' + dump({'temas': meta, 'preguntas': preguntas}) + ';\n'
open(os.path.join(base, 'temario', 'datos.js'), 'w', encoding='utf8').write(out)
outp = ('// Generado por tools/build_temario.py. PRIVADO: no publicar en GitHub.\n'
        'const TEMARIO_PRIVADO = ' + dump({'preguntas': privadas}) + ';\n')
open(os.path.join(base, 'temario', 'datos_privado.js'), 'w', encoding='utf8').write(outp)
print('público:', {m['name']: m['n'] for m in meta}, f'{len(out) / 1024:.0f} KB')
print('privado:', {k: len(v) for k, v in privadas.items()}, f'{len(outp) / 1024:.0f} KB')
