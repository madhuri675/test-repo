# To-Do List App

A clean, responsive to-do list page built with plain HTML, CSS and JavaScript — no framework and no build step. Your tasks are saved in the browser, so they are still there after a refresh.

## What the app does

- **Add a task** — type into the input field and press **Add Task** (or press Enter).
- **Mark a task as completed** — tick its checkbox. Completed tasks are struck through; untick to undo.
- **Delete a task** — use the delete button on the task row.
- **Tasks left** — the header shows how many tasks are still to do.
- **Remembers your tasks** — tasks are kept in the browser's local storage and restored when the page reloads.
- **Responsive** — the layout adapts to phone, tablet and desktop widths.
- **Sensible edge cases** — blank or whitespace-only tasks are refused with a short message, and a friendly message appears while the list is empty.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page: header, the input field with the Add Task button, and the task list. |
| `styles.css` | All styling, including the responsive layout. |
| `todoStore.js` | The task logic — add, complete, delete, count, save and restore — with no dependencies. |
| `app.js` | Connects the page to the task logic: draws the list and handles adding, ticking and deleting. |
| `tests/todo-store.test.js` | 14 automated tests for the task logic. |
| `package.json` | Only needed to run the tests. |
| `.github/workflows/tests.yml` | Runs the tests automatically on every push and pull request. |

## How to run the app

No install and no build step are needed.

1. Get the files: download the branch, or run `git clone` and switch to `feature/todo-app`.
2. Open `index.html` in a web browser (double-clicking it is enough).

If your browser is strict about pages opened straight from disk, serve the folder instead:

```
npx serve .
```

or

```
python3 -m http.server 8000
```

then open the address the command prints.

## How to run the tests

You need Node.js 18 or newer.

```
npm install
npm test
```

`npm test` uses Node's built-in test runner on `tests/todo-store.test.js`. The 14 tests cover adding a task, rejecting blank and whitespace-only input, tidying extra spaces, marking a task complete and undoing it, the tasks-left count, deleting a task, saving to and restoring from local storage, and coping with broken or missing saved data.

The same tests also run on GitHub in `.github/workflows/tests.yml` on every push and every pull request — open the **Actions** tab of the repository to see the result of the latest run.
