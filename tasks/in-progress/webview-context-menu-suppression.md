# Context Menu Right Click inside Webviews

## Description
When right clicking inside a loaded Chromium context (eg `github.com`), the MacOS/Chromium internal menu pops up layered over our components. 

## Status
In Progress. Natively suppressing `'context-menu'` via Javascript directly inside the `WebviewComponent`. Currently testing dispatch logic back upwards to main IPC.

## Next Steps
Need to configure `main/index.ts` WebContents handler to map those suppressed generic right-clicks onto our Dopomogai context menu logic via Inter-Process Communication.