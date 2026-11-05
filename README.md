# Math Reference

A mobile-first interactive mathematical reference library built with HTML, CSS, and vanilla JavaScript. Includes Sigmoid Function, Normal Distribution, and Graph Theory. No dependencies or build step.

## Run locally

From this directory, run:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Serve over HTTP rather than opening HTML files directly because the application uses JavaScript modules. Clipboard access normally requires HTTPS or localhost; a selectable-text fallback is provided.

## GitHub Pages

Push the site to GitHub. In **Settings → Pages**, select **Deploy from a branch**, choose the desired branch and **/ (root)**, and save. All asset and navigation paths are relative, supporting repository-based Pages URLs. No workflow or build action is required.

## Structure

- `index.html`: library entry point.
- `concept.html`: reusable concept-page entry point; `?concept=sigmoid`, `normal`, or `graph` selects the concept.
- `assets/styles.css`: responsive layouts, visualization styling, and automatic system light/dark themes.
- `assets/app.js`: concept metadata, shared layout, search/category filtering, controls, SVG graphs, and network editor.
- `assets/math.js`: mathematical functions and graph export helpers.
- `tests/math.test.mjs`: dependency-free numerical and graph data checks (Node.js 22+).
- `tests/browser_smoke.py`: browser interaction checks using optional Python Playwright test tooling.

To add a concept, add metadata to the concept registry in `app.js` and an appropriate visualization initializer. Shared navigation, cards, information sections, and styling come from the common template.

## Interaction

Function controls update immediately. Normal shading shows μ ± σ (approximately 68.27% probability). Plots use an x range of −10 to 10; normal density scales vertically with σ. Copy equation exports the current parameter values; the Desmos link opens its calculator, where the equation can be pasted.

The network is a simple undirected graph. Drag vertices, or focus a vertex and use arrow keys. Select a vertex or edge and choose **Remove selected**. Removing a vertex also removes its incident edges. Add edges using the vertex selectors; loops and duplicate edges are rejected. Randomize replaces the network. Copy graph data exports JSON containing vertex IDs, visualization coordinates, and edge endpoints. Changes are session-only and reset on reload.

## Checks

```sh
node --test tests/math.test.mjs
```

The numerical checks require no package installation. To repeat the automated browser checks, install Python Playwright in your development tooling, start the local server, and run `python3 tests/browser_smoke.py`. It uses an installed Chromium browser (or Playwright’s bundled Chromium); set `CHROMIUM_PATH` to override the browser or `MATH_REFERENCE_URL` to override the server URL. Playwright is test tooling only and is not a site dependency.

For a manual browser smoke check, test search/category combinations, both sliders on each function, network edits and dragging, copy actions, collapsed information panels, and narrow-screen light/dark layouts.
