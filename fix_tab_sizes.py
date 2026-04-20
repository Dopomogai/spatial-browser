import re

with open("/root/Documents/GitHub/spatial-browser/src/renderer/src/App.tsx", "r") as f:
    content = f.read()

old_block = """      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOmnibarOpen(true)
      }"""

new_block = """      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOmnibarOpen(true)
      }"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open("/root/Documents/GitHub/spatial-browser/src/renderer/src/App.tsx", "w") as f:
        f.write(content)
    print("Replaced!")
else:
    print("Could not find old block")
