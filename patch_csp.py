import os

file_path = '/root/Documents/GitHub/spatial-browser/src/renderer/index.html'

with open(file_path, 'r') as f:
    content = f.read()

# Update the Content Security Policy to fix the TLDraw fetch crash and the webview-src warning
new_content = content.replace(
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self' 'unsafe-inline' 'unsafe-eval' data:; webview-src *; object-src 'none'\">",
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https://cdn.tldraw.com blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none'\">"
)

with open(file_path, 'w') as f:
    f.write(new_content)
