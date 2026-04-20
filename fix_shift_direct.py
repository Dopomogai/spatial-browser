import re

with open("/root/Documents/GitHub/spatial-browser/src/renderer/src/App.tsx", "r") as f:
    content = f.read()

old_block = """    const handleIpcShiftState = (_event: any, isHeld: boolean) => {
        window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: isHeld } }));
    };

    if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.on('shift-state-change', handleIpcShiftState);
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('open-new-profile-modal', handleProfileModalOpen)"""

new_block = """    const handleIpcShiftState = (_event: any, isHeld: boolean) => {
        window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: isHeld } }));
    };

    const handleWindowBlur = () => {
        // Clear shift lock globally when clicking away or into webviews 
        // that trap focus
        window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: false } }));
    };

    if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.on('shift-state-change', handleIpcShiftState);
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('open-new-profile-modal', handleProfileModalOpen)"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open("/root/Documents/GitHub/spatial-browser/src/renderer/src/App.tsx", "w") as f:
        f.write(content)
    print("Replaced!")
else:
    print("Could not find old block")
