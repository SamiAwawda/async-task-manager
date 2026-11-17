# Async Task Manager

A small Node.js backend written in TypeScript (ESM) that manages tasks and users with async operations (Promises / `async`-`await`). Data is kept in memory, and every operation has a simulated delay so the async behaviour is visible, like a real database call would be.

## Requirements covered

| Requirement | Where |
|---|---|
| Node.js + TypeScript + ESM | `"type": "module"`, `module: NodeNext` in `tsconfig.json` |
| `Task` and `User` interfaces | `src/types.ts` |
| Async operations with Promises / async-await | `src/taskService.ts` (`createTask`, `getTask`, `listTasks`, `updateTask`, `assignTask`, `deleteTask`, `createUser`) |
| Success and failure handling | Custom errors in `src/errors.ts` (`TaskNotFoundError`, `UserNotFoundError`, `ValidationError`). Failed operations reject the Promise; `src/index.ts` shows `try/catch` and `Promise.allSettled` |
| Strict mode + npm scripts | `"strict": true` in `tsconfig.json`; scripts below |
| Verified | 22 tests in `src/taskService.test.ts` (Node's built-in test runner) |

## Getting started

Requires Node.js 22 or newer (developed and tested on Node 26).

```bash
npm install
npm start        # build, then run the demo in src/index.ts
npm test         # build, then run all tests
```

| Script | What it does |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run typecheck` | Type-check without emitting files |
| `npm start` | Build and run the demo (`dist/index.js`) |
| `npm test` | Build and run the tests with `node --test` |
| `npm run clean` | Delete `dist/` |

## Project structure

```
src/
  types.ts              Task, User and input interfaces
  errors.ts             Custom error classes
  taskService.ts        In-memory async TaskService
  taskService.test.ts   Tests
  index.ts              Demo script (success and failure cases)
```

## Design notes

- Every `TaskService` method is `async` and returns a Promise. A failure (task not found, invalid input, unknown assignee) rejects that Promise with a typed error, so callers can use `try/catch` and `instanceof`.
- `new TaskService({ delayMs })` sets the simulated latency (default `0`, the demo uses `100`).
- Methods return copies of stored objects, so changing a returned task does not change the stored one.

## AI use

I used **Claude Code** (Anthropic, model Claude Sonnet 5.5) while building this assignment:

- **Planning:** it read the assignment requirements and I chose the scope together with it: an in-memory library plus a demo script, not an HTTP server.
- **Code:** it wrote the project configuration, the interfaces, the `TaskService`, the demo script, and this README.
- **Tests first:** the tests in `src/taskService.test.ts` were written before the implementation. I watched them fail (the modules did not exist yet) and then pass once the service was written.
- **Verification:** `npm test` (22 passing tests) and `npm start` were run before publishing.

I reviewed the generated code before submitting it.
