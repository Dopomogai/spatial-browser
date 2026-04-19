import os

file_path = '/root/Documents/GitHub/spatial-browser/src/main/index.ts'

with open(file_path, 'r') as f:
    content = f.read()

new_content = content.replace(
    "sandbox: false,",
    "// Bypass sandbox for root execution in agent dev environment\n      sandbox: false,"
)

# Also add the no-sandbox switch
new_content = new_content.replace(
    "app.commandLine.appendSwitch('remote-debugging-port', '9222')",
    "app.commandLine.appendSwitch('remote-debugging-port', '9222')\napp.commandLine.appendSwitch('no-sandbox')\napp.commandLine.appendSwitch('disable-gpu')"
)

with open(file_path, 'w') as f:
    f.write(new_content)
