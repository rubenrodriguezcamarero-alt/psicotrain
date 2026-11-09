"""Monta la app en un solo HTML para la copia privada de claude.ai.

Incluye temario/datos_privado.js (temas con restricciones de difusión) si existe.
Uso: python3 tools/build_artifact.py <salida.html>
"""
import base64, os, sys

d = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
html = open(d + 'index.html', encoding='utf8').read()
css = open(d + 'styles.css', encoding='utf8').read()
css = css.replace("padding: calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 24px);",
                  "padding-block: 16px 24px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));")
css = css.replace("min-height: 100vh; min-height: 100dvh;", "min-height: 100%;")
uri = lambda f, t: f'data:{t};base64,' + base64.b64encode(open(d + f, 'rb').read()).decode()
icon, c1, c2 = uri('icons/icon-192.png', 'image/png'), uri('assets/cara.jpg', 'image/jpeg'), uri('assets/cara2.jpg', 'image/jpeg')
body = html[html.index('<body>') + 6:html.index('<script src="data.js">')]
body = body.replace('src="icons/icon-192.png"', f'src="{icon}"').replace('src="assets/cara.jpg"', f'src="{c1}"')
scripts = ['data.js', 'figures.js', 'spatial.js', 'motivacion.js', 'temario/datos.js', 'lineas/datos.js', 'lineas.js']
if os.path.exists(d + 'temario/datos_privado.js'):
    scripts.append('temario/datos_privado.js')
scripts.append('app.js')
js = '\n'.join(open(d + f, encoding='utf8').read() for f in scripts)
js = js.replace("src: 'assets/cara.jpg'", f"src: '{c1}'").replace("src: 'assets/cara2.jpg'", f"src: '{c2}'")
out = (f'<title>PsicoTrain</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
       f'<meta name="theme-color" content="#0b0f24">\n<style>\n{css}\n</style>\n{body}\n<script>\n{js}\n</script>\n')
open(sys.argv[1], 'w', encoding='utf8').write(out)
print('incluye privado:', 'temario/datos_privado.js' in scripts, f'{len(out) / 1024:.0f} KB')
