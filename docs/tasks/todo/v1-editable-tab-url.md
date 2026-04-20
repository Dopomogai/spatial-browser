# Editable Tab URL Bar

## Description
The URL bar displayed in the header of each floating widget is currently a read-only visual element. It needs to be an editable `<input>` field so users can type new URLs directly into existing tabs without needing to spawn a brand new window from the Omnibar.

## Status
Todo

## Sub-tasks
- Convert the URL span in `BrowserWidgetComponent.tsx` header to an `<input>`.
- Bind `onChange` and `onKeyDown` (Enter) to trigger a `webviewRef.current.loadURL()` call.