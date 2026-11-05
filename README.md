# Math Reference

A mobile-first interactive mathematical reference library built with HTML, CSS, and vanilla JavaScript. Includes eleven concepts: Sigmoid Function, Normal Distribution, Graph Theory, Compound Interest, Derivatives, Probability & Coin Flips, Trigonometric Functions, Exponential Growth & Decay, Logarithmic Functions, Binomial Distribution, and Unit Circle. No dependencies or build step.

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
- `concept.html`: reusable concept-page entry point; `?concept=sigmoid`, `normal`, `graph`, `interest`, `derivatives`, `coins`, `trigonometric`, `exponential`, `logarithmic`, `binomial`, or `unit-circle` selects the concept.
- `assets/styles.css`: responsive layouts, visualization styling, and automatic system light/dark themes.
- `assets/app.js`: concept metadata, shared layout, search/category filtering, controls, SVG graphs, and network editor.
- `assets/extra-concepts.js`: metadata and visualizations for compound interest, derivatives, and coin flips.
- `assets/wave-concepts.js`: metadata and visualizations for the five newest concepts.
- `assets/charts.js`: shared responsive SVG coordinates, tick formatters, clipping, paths, metrics, and control initialization.
- `assets/math.js`: mathematical functions and graph export helpers.
- `tests/math.test.mjs`: dependency-free numerical and graph data checks (Node.js 22+).
- `tests/browser_smoke.py`: regression browser checks for the original six concepts and eleven-page mobile layouts.
- `tests/new_concepts_smoke.py`: the five newest visualizations, all-concept search/navigation, copy actions, touch controls, and circle geometry; uses the same optional Playwright tooling.

To add a concept, extend the appropriate concept module’s metadata and initializer and register it in `app.js`. Reuse `charts.js` for Cartesian plots; specialized geometry such as the unit circle uses its own SVG coordinate system. Shared navigation, cards, information sections, and styling come from the common template.

## Interaction

Function controls update immediately. Normal shading shows μ ± σ (approximately 68.27% probability). Plots use an x range of −10 to 10; normal density scales vertically with σ. Copy equation exports the current parameter values; the Desmos link opens its calculator, where the equation can be pasted.

The network is a simple undirected graph. Drag vertices, or focus a vertex and use arrow keys. Select a vertex or edge and choose **Remove selected**. Removing a vertex also removes its incident edges. Add edges using the vertex selectors; loops and duplicate edges are rejected. Randomize replaces the network. Copy graph data exports JSON containing vertex IDs, visualization coordinates, and edge endpoints. Changes are session-only and reset on reload.

Compound Interest uses annual compounding, principal $100–$100,000, annual rate 0%–15%, and time 1–50 years. Annual balance points are joined by line segments; principal and earned interest use distinct shading. Rates are constant and exclude contributions, fees, and taxes. Values use USD formatting.

Derivatives shows f(x) = x² with f′(x) = 2x. Move the x slider from −5 to 5 to update the point, tangent, value, and slope. Separate copy buttons export the function and derivative. Direct point dragging is not implemented.

Probability & Coin Flips uses independent pseudorandom fair flips (`Math.random`). Batch controls add 1, 10, or 100 trials, recording the running proportion after every flip. The empty state shows an undefined experimental percentage; reset clears all results. The law of large numbers describes a long-run tendency, not a guarantee for an individual run. Histories are session-only. The chart samples long histories to keep the SVG lightweight (all trials remain in the numerical counts and history).

Trigonometric Functions plots sine (solid) and cosine (dashed) on −2π to 2π with fixed vertical limits so amplitude changes remain visible. Amplitude ranges from 0.1–3, frequency multiplier from 0.5–4, and the phase control expresses C in multiples of π from −2π to 2π. Independent checkboxes can hide either curve. Period is 2π/B and horizontal displacement is −C/B.

Exponential Growth & Decay plots y = Ae^(kx), with A = 1–100, k = −1–1, and time horizon 1–20. The vertical scale adapts, k = 0 is constant, and positive/negative k shows doubling time/half-life. Large or tiny values use scientific notation. Time units are abstract and consistent with k.

Logarithmic Functions supports bases 2, e, and 10 only, so invalid bases cannot be selected. Domain upper bound ranges from 2–20. Logarithmically spaced samples resolve the positive-domain curve near x = 0; (1, 0) is highlighted. A finite plot clips the curve below y = −5; the mathematical function continues toward −∞ at zero.

Binomial Distribution supports 1–50 trials and probabilities from 0–1. The outcome slider’s upper bound follows n and clamps k when n decreases. Bars use distinct fill and outline for the selected outcome. Probabilities, mean, and standard deviation include exact degenerate endpoint cases p = 0 and p = 1; interior probabilities use floating-point multiplicative binomial coefficients. On narrow screens with n = 50, select individual outcomes with the slider rather than tiny bars.

Unit Circle supports 0°–360°, displays radians alongside sine/cosine, and allows mouse or touch dragging of the point. Equal SVG coordinate scales preserve a circular shape at all viewport sizes. The slider provides keyboard access and one-degree precision. Cardinal-angle numerical noise is removed from displayed coordinates.

All five additions reuse existing categories and the collapsed explanation template. Related concepts become links only when the target exists. Equations can be copied; Desmos opens its calculator separately. There are no site dependencies or build steps.

## Checks

```sh
node --test tests/math.test.mjs
# With the static server running and optional Python Playwright tooling:
python3 tests/browser_smoke.py
python3 tests/new_concepts_smoke.py
```

The numerical checks require no package installation. To repeat the automated browser checks, install Python Playwright in your development tooling, start the local server, and run `python3 tests/browser_smoke.py`. It uses an installed Chromium browser (or Playwright’s bundled Chromium); set `CHROMIUM_PATH` to override the browser or `MATH_REFERENCE_URL` to override the server URL. Playwright is test tooling only and is not a site dependency.

For a manual browser smoke check, test search/category combinations, sliders on each function, compound-interest extremes and 0% rates, tangent slopes, coin batches and reset, network edits and dragging, copy actions, collapsed information panels, and narrow-screen light/dark layouts.
