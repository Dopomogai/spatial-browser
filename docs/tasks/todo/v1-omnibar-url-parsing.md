# Omnibar URL Parsing & Direct Routing

## Description
When typing a fully qualified URL (e.g., `https://example.com` or `github.com`) into the new tab omnibar, the system routes the query to Google Search rather than directly navigating to the URL.

## Status
Todo

## Sub-tasks
- Update the regex/parsing logic in `handleSubmit` within `Omnibar.tsx`.
- Ensure standard top-level domains (or explicit protocols) bypass the `https://www.google.com/search?q=` wrapper.