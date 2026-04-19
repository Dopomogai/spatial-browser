import os

file_path = '/root/Documents/GitHub/spatial-browser/src/renderer/index.html'

with open(file_path, 'r') as f:
    content = f.read()

# Make CSP even more permissive for dev environments and fonts/icons
new_content = content.replace(
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https://cdn.tldraw.com blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none'\">",
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline'; font-src * data: 'unsafe-inline';\">\n"
)

with open(file_path, 'w') as f:
    f.write(new_content)
