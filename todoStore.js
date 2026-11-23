/*
 * Task logic and local-storage persistence for the to-do app.
 *
 * Plain JavaScript with no dependencies, so the same file runs in the browser
 * (as window.TodoStore) and in the Node test suite (via require).
 */
(function (root, factory) {
  'use strict';

  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TodoStore = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STORAGE_KEY = 'todo-app.tasks.v1';
  var MAX_LENGTH = 200;

  // Trim the ends, collapse runs of spaces and cap the length.
  function normaliseText(raw) {
    if (raw === null || raw === undefined) {
      return '';
    }
    return String(raw).replace(/\s+/g, ' ').trim().slice(0, MAX_LENGTH);
  }

  function isStoredTask(value) {
    return (
      !!value &&
      typeof value === 'object' &&
      typeof value.text === 'string' &&
      normaliseText(value.text) !== ''
    );
  }

  function newId() {
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function createStore(storage) {
    var backend = storage || null;

    function hasStorage() {
      return !!backend && typeof backend.getItem === 'function' && typeof backend.setItem === 'function';
    }

    // Read the saved tasks. Bad or missing data gives an empty list, never an error.
    function load() {
      if (!hasStorage()) {
        return [];
      }

      var raw;
      try {
        raw = backend.getItem(STORAGE_KEY);
      } catch (error) {
        return [];
      }

      if (!raw) {
        return [];
      }

      var parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        return [];
      }

      if (!Array.isArray(parsed)) {
        return [];
      }

      var tasks = [];
      for (var i = 0; i < parsed.length; i += 1) {
        if (!isStoredTask(parsed[i])) {
          continue;
        }
        tasks.push({
          id: typeof parsed[i].id === 'string' && parsed[i].id !== '' ? parsed[i].id : newId(),
          text: normaliseText(parsed[i].text),
          completed: parsed[i].completed === true
        });
      }
      return tasks;
    }

    function save(tasks) {
      if (!hasStorage()) {
        return false;
      }
      try {
        backend.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
      } catch (error) {
        return false;
      }
    }

    // Add a task. Empty or whitespace-only text is rejected with a message.
    function add(tasks, rawText) {
      var list = tasks || [];
      var text = normaliseText(rawText);

      if (text === '') {
        return {
          ok: false,
          error: 'Please type a task before adding it.',
          tasks: list
        };
      }

      var task = { id: newId(), text: text, completed: false };
      var next = list.concat([task]);
      save(next);
      return { ok: true, error: '', task: task, tasks: next };
    }

    // Flip one task between completed and not completed.
    function toggle(tasks, id) {
      var next = (tasks || []).map(function (task) {
        if (task.id !== id) {
          return task;
        }
        return { id: task.id, text: task.text, completed: !task.completed };
      });
      save(next);
      return next;
    }

    // Remove one task.
    function remove(tasks, id) {
      var next = (tasks || []).filter(function (task) {
        return task.id !== id;
      });
      save(next);
      return next;
    }

    function remaining(tasks) {
      return (tasks || []).filter(function (task) {
        return !task.completed;
      }).length;
    }

    return {
      STORAGE_KEY: STORAGE_KEY,
      load: load,
      save: save,
      add: add,
      toggle: toggle,
      remove: remove,
      remaining: remaining
    };
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    MAX_LENGTH: MAX_LENGTH,
    normaliseText: normaliseText,
    newId: newId,
    createStore: createStore
  };
});
