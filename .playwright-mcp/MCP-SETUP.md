# Playwright MCP — Browser Automation for LifeStock

## What This Is
Official Microsoft MCP server for browser automation via Playwright.
36,597+ stars. 69 tools for full browser control through Model Context Protocol.

## Installation
```bash
npx @playwright/mcp@latest
```

## MCP Client Config
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

## Tool Categories (69 tools)

### Core Automation (24)
browser_navigate, browser_click, browser_type, browser_fill_form,
browser_hover, browser_drag, browser_drop, browser_press_key,
browser_select_option, browser_file_upload, browser_evaluate,
browser_snapshot, browser_take_screenshot, browser_find,
browser_handle_dialog, browser_close, browser_navigate_back,
browser_resize, browser_run_code_unsafe, browser_wait_for,
browser_tabs, browser_get_config, browser_console_messages,
browser_network_requests

### Network & Routing (5)
browser_network_request, browser_network_state_set,
browser_route, browser_route_list, browser_unroute

### Storage (14)
browser_cookie_* (get, set, list, delete, clear)
browser_localstorage_* (get, set, list, delete, clear)
browser_sessionstorage_* (get, set, list, delete, clear)
browser_set_storage_state, browser_storage_state

## Use Cases for LifeStock
1. E2E testing: navigate, fill forms, verify snapshots
2. Supplier scraping: automate inventory data collection
3. Visual regression: take screenshots across UI states
4. Form automation: test barcode scanner, settings, shopping lists

## Integration with Browserbase
LifeStock agents can use either:
- Playwright MCP (local browser, MCP protocol) — for development/testing
- Browserbase (cloud browser, CDP) — for production scraping
