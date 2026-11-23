/*
 * Automated tests for the to-do app.
 *
 * They exercise todoStore.js, which is the same task logic the page uses in
 * the browser: adding a task, rejecting blank input, completing a task,
 * deleting a task, and saving to / restoring from local storage.
 *
 * Run them with: npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const TodoStore = require('../todoStore.js');

const STORAGE_KEY = 'todo-app.tasks.v1';

// A small stand-in for the browser's localStorage.
function createMemoryStorage(seed) {
  const data = Object.assign({}, seed || {});
  return {
    data: data,
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem: function (key, value) {
      data[key] = String(value);
    },
    removeItem: function (key) {
      delete data[key];
    }
  };
}

function newStore(storage) {
  return TodoStore.createStore(storage || createMemoryStorage());
}

test('adding a task puts it in the list', function () {
  const store = newStore();
  const result = store.add([], 'Buy milk');

  assert.equal(result.ok, true);
  assert.equal(result.tasks.length, 1);
  assert.equal(result.tasks[0].text, 'Buy milk');
  assert.equal(result.tasks[0].completed, false);
  assert.ok(result.tasks[0].id, 'the task should get an id');
});

test('several tasks keep the order they were added in', function () {
  const store = newStore();
  const first = store.add([], 'Buy milk');
  const second = store.add(first.tasks, 'Write report');

  assert.deepEqual(second.tasks.map(function (task) {
    return task.text;
  }), ['Buy milk', 'Write report']);
});

test('extra spaces in a task are tidied up', function () {
  const store = newStore();
  const result = store.add([], '  Buy   milk  ');

  assert.equal(result.ok, true);
  assert.equal(result.tasks[0].text, 'Buy milk');
});

test('an empty task is rejected', function () {
  const store = newStore();
  const result = store.add([], '');

  assert.equal(result.ok, false);
  assert.equal(result.tasks.length, 0);
  assert.ok(result.error, 'a message should explain what went wrong');
});

test('a task of only spaces is rejected', function () {
  const store = newStore();
  const before = store.add([], 'Buy milk');
  const result = store.add(before.tasks, '   \t  ');

  assert.equal(result.ok, false);
  assert.equal(result.tasks.length, 1);
  assert.equal(result.tasks[0].text, 'Buy milk');
});

test('a task can be marked as completed and undone again', function () {
  const store = newStore();
  const added = store.add([], 'Buy milk');
  const id = added.tasks[0].id;

  const completed = store.toggle(added.tasks, id);
  assert.equal(completed[0].completed, true);
  assert.equal(completed[0].text, 'Buy milk');

  const undone = store.toggle(completed, id);
  assert.equal(undone[0].completed, false);
});

test('the count of tasks left goes down when one is completed', function () {
  const store = newStore();
  const first = store.add([], 'Buy milk');
  const second = store.add(first.tasks, 'Write report');

  assert.equal(store.remaining(second.tasks), 2);

  const completed = store.toggle(second.tasks, second.tasks[0].id);
  assert.equal(store.remaining(completed), 1);
});

test('a task can be deleted', function () {
  const store = newStore();
  const first = store.add([], 'Buy milk');
  const second = store.add(first.tasks, 'Write report');
  const idToDelete = second.tasks[0].id;

  const after = store.remove(second.tasks, idToDelete);

  assert.equal(after.length, 1);
  assert.equal(after[0].text, 'Write report');
});

test('deleting a task that is not there changes nothing', function () {
  const store = newStore();
  const added = store.add([], 'Buy milk');
  const after = store.remove(added.tasks, 'no-such-id');

  assert.equal(after.length, 1);
  assert.equal(after[0].text, 'Buy milk');
});

test('adding a task saves it to local storage', function () {
  const storage = createMemoryStorage();
  const store = TodoStore.createStore(storage);
  store.add([], 'Buy milk');

  const saved = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(saved.length, 1);
  assert.equal(saved[0].text, 'Buy milk');
  assert.equal(saved[0].completed, false);
});

test('tasks are restored from local storage when the page loads', function () {
  const storage = createMemoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify([
    { id: 'a1', text: 'Buy milk', completed: true },
    { id: 'b2', text: 'Write report', completed: false }
  ]));

  const store = TodoStore.createStore(storage);
  const restored = store.load();

  assert.equal(restored.length, 2);
  assert.equal(restored[0].text, 'Buy milk');
  assert.equal(restored[0].completed, true);
  assert.equal(store.remaining(restored), 1);
});

test('a completed task stays completed after a save and reload', function () {
  const storage = createMemoryStorage();
  const first = TodoStore.createStore(storage);
  const added = first.add([], 'Buy milk');
  const completed = first.toggle(added.tasks, added.tasks[0].id);

  const second = TodoStore.createStore(storage);
  const restored = second.load();

  assert.equal(restored.length, 1);
  assert.equal(restored[0].completed, true);
  assert.equal(completed[0].completed, true);
});

test('broken saved data is ignored instead of crashing the page', function () {
  const brokenJson = createMemoryStorage();
  brokenJson.setItem(STORAGE_KEY, 'not-json');
  assert.deepEqual(TodoStore.createStore(brokenJson).load(), []);

  const notAList = createMemoryStorage();
  notAList.setItem(STORAGE_KEY, '{"a":1}');
  assert.deepEqual(TodoStore.createStore(notAList).load(), []);
});

test('the app still works when there is no local storage', function () {
  const store = TodoStore.createStore(null);

  assert.deepEqual(store.load(), []);
  const added = store.add([], 'Buy milk');
  assert.equal(added.ok, true);
  assert.equal(added.tasks.length, 1);
  assert.equal(store.save(added.tasks), false);
});
