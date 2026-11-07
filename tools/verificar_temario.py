"""Comprueba las preguntas del temario contra el texto del PDF.

Uso: python3 tools/verificar_temario.py <texto_del_pdf.txt> <preguntas.json> [más .json]
Cada pregunta: [enunciado, correcta, incorrecta1, incorrecta2, referencia, cita literal].
"""
import json, re, sys, unicodedata

def norm(s):
    s = unicodedata.normalize('NFC', s).replace('­', '')
    s = re.sub(r'-\s*\n\s*', '', s)          # palabras partidas al final de línea
    return re.sub(r'\s+', ' ', s).strip().lower()

texto = norm(open(sys.argv[1], encoding='utf8').read())
vistos, errores, total = {}, 0, 0
for f in sys.argv[2:]:
    for i, q in enumerate(json.load(open(f, encoding='utf8'))):
        total += 1
        donde = f'{f.split("/")[-1]}#{i + 1}'
        if len(q) != 6 or not all(isinstance(x, str) and x.strip() for x in q):
            print('FORMATO', donde, q[:1]); errores += 1; continue
        enun, ok, w1, w2, ref, cita = q
        if len({norm(ok), norm(w1), norm(w2)}) < 3:
            print('OPCIONES REPETIDAS', donde, enun[:60]); errores += 1
        if norm(cita) not in texto:
            print('CITA NO ENCONTRADA', donde, '«' + cita[:80] + '»'); errores += 1
        k = norm(enun) + '|' + norm(ok)
        if k in vistos:
            print('PREGUNTA REPETIDA', donde, '=', vistos[k]); errores += 1
        vistos[k] = donde
print(f'{total} preguntas revisadas, {errores} problemas')
sys.exit(1 if errores else 0)
