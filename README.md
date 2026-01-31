# polycule graph

**polycule graph** is a modern, minimal web app for creating, editing, and visualizing graphs using DOT markup. It features:

- **Live Graph Visualization:** Instantly see your graph rendered as you edit DOT code.
- **DOT Markup Editor:** Edit your graph structure using an editor in the sidebar.
- **Shareable Links:** Copy a URL that encodes your current graph, making sharing easy.

## Features

- Add, edit, and delete nodes and edges visually or via DOT code.
- Real-time graph rendering with Cytoscape.js.
- Copy a shareable link to your current graph state.

## Contributing

For local development, install dependencies with `pnpm install`. In CI (GitHub Actions), use `pnpm install --frozen-lockfile` to ensure the lockfile stays consistent. To speed up CI runs, cache the pnpm store directory (use `pnpm store path` to get the path, or set `PNPM_STORE_PATH` explicitly in the workflow).

## TODO

- [ ] **Visual Graph Editing:**
  - [ ] Right-click nodes/edges to edit properties
  - [ ] New nodes should pick from popular trans girl names
- [ ] **Export/Import**: Add support for exporting graphs to image (PNG/SVG) and importing from files.
- [ ] **Better Error Handling**: Improve DOT parsing error messages and user feedback.
- [ ] **Node/Edge Styling**: Allow users to customize node shapes, colors, and edge styles via UI.
- [ ] **Templates**: Provide example graph templates for quick starting points.
- [ ] **Help/Docs**: Add a help section or tooltips for DOT syntax and app usage.
