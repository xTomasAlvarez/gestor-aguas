# Code Review Rules

## General
- All code must be in Spanish, including variable names, functions, and comments, unless it is a standard library name.
- Imports should be organized: first React, then external libraries, then absolute paths from the project, and finally relative paths.

## React
- Use functional components with Hooks.
- Component file names must be in PascalCase (e.g., `MyComponent.jsx`).
- Custom hooks must start with the prefix `use` (e.g., `useCustomHook.js`).

## JavaScript
- Use `const` by default, and `let` only when a variable needs to be reassigned. Avoid `var`.
- Use arrow functions `() => {}` for callbacks and function expressions.
- Prefer Promises or async/await for asynchronous operations.
