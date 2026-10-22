# Contributing

Thanks for helping improve Timefold. Small, focused changes are easiest to review.

## Before opening an issue

- Search existing issues for the same bug or idea.
- For a bug report, include your browser, operating system, steps to reproduce, and the behavior you expected.
- Do not attach private or sensitive video. A short description or synthetic sample is usually enough.

## Before opening a pull request

1. Create a focused branch and explain the behavior your change addresses.
2. Keep the frontend dependency-free beyond the libraries already in the project unless a new dependency is necessary.
3. Run `npm ci`, `npm test`, and `npm run build`.
4. Include a screenshot when a change affects the interface or rendering.
5. Link the related issue and note any browser or performance limitations.

## Project conventions

- Use the existing Vite, vanilla JavaScript, and Three.js setup.
- Keep image geometry and pixel-processing helpers independently testable where practical.
- Avoid sending video data to external services. The intended processing path is local to the browser.
- Do not commit build output, `node_modules`, private media, or secrets.
