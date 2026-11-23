/*
 * Wires the to-do app markup to the task store: renders the list and handles
 * adding, completing and deleting tasks.
 */
(function (window, document) {
  'use strict';

  var started = false;

  function init() {
    if (started) {
      return;
    }
    started = true;

    var storage = null;
    try {
      storage = window.localStorage;
    } catch (error) {
      storage = null; // Private-mode browsers can block storage; the app still works.
    }

    var store = window.TodoStore.createStore(storage);
    var tasks = store.load();

    var form = document.getElementById('task-form');
    var input = document.getElementById('taskInput');
    var list = document.getElementById('taskList');
    var message = document.getElementById('form-message');
    var emptyState = document.getElementById('empty-state');
    var countLabel = document.getElementById('task-count');

    function buildItem(task) {
      var item = document.createElement('li');
      item.className = task.completed ? 'task is-completed' : 'task';
      item.setAttribute('data-id', task.id);

      var toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.className = 'task__toggle';
      toggle.checked = task.completed;
      toggle.setAttribute('data-action', 'toggle');
      toggle.setAttribute(
        'aria-label',
        (task.completed ? 'Mark "' : 'Mark "') + task.text + '" as ' + (task.completed ? 'not completed' : 'completed')
      );

      var text = document.createElement('span');
      text.className = 'task__text';
      text.textContent = task.text;

      var removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'task__delete';
      removeButton.setAttribute('data-action', 'delete');
      removeButton.setAttribute('aria-label', 'Delete "' + task.text + '"');
      removeButton.textContent = 'Delete';

      item.appendChild(toggle);
      item.appendChild(text);
      item.appendChild(removeButton);
      return item;
    }

    function render() {
      list.textContent = '';

      for (var i = 0; i < tasks.length; i += 1) {
        list.appendChild(buildItem(tasks[i]));
      }

      var left = store.remaining(tasks);
      countLabel.textContent = left === 1 ? '1 task left' : left + ' tasks left';

      if (tasks.length === 0) {
        emptyState.classList.remove('is-hidden');
      } else {
        emptyState.classList.add('is-hidden');
      }
    }

    function showMessage(text) {
      message.textContent = text || '';
    }

    function findItemId(target) {
      var node = target;
      while (node && node !== list) {
        if (node.getAttribute && node.getAttribute('data-id')) {
          return node.getAttribute('data-id');
        }
        node = node.parentNode;
      }
      return null;
    }

    function onSubmit(event) {
      event.preventDefault();
      var result = store.add(tasks, input.value);

      if (!result.ok) {
        showMessage(result.error);
        input.focus();
        return;
      }

      tasks = result.tasks;
      showMessage('');
      input.value = '';
      render();
      input.focus();
    }

    function onChange(event) {
      var target = event.target;
      if (!target || !target.getAttribute || target.getAttribute('data-action') !== 'toggle') {
        return;
      }
      var id = findItemId(target);
      if (!id) {
        return;
      }
      tasks = store.toggle(tasks, id);
      render();
    }

    function onClick(event) {
      var target = event.target;
      if (!target || !target.getAttribute || target.getAttribute('data-action') !== 'delete') {
        return;
      }
      var id = findItemId(target);
      if (!id) {
        return;
      }
      tasks = store.remove(tasks, id);
      render();
      input.focus();
    }

    form.addEventListener('submit', onSubmit);
    list.addEventListener('change', onChange);
    list.addEventListener('click', onClick);
    input.addEventListener('input', function () {
      showMessage('');
    });

    render();
  }

  window.TodoApp = {
    init: init,
    isStarted: function () {
      return started;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window, document);
