import os

file_path = '/root/Documents/GitHub/spatial-browser/src/renderer/src/components/canvas/SpatialCanvas.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Add assetUrls prop to bypass CDN fetching for translations and SVGs
new_content = content.replace(
    "<Tldraw",
    "<Tldraw\n        assetUrls={{ translations: 'https://cdn.tldraw.com/translations/', icons: 'https://cdn.tldraw.com/icons/', fonts: 'https://cdn.tldraw.com/fonts/' }}"
)

with open(file_path, 'w') as f:
    f.write(new_content)
