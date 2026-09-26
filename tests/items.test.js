// Tests for the example list logic in public/lib/items.js. Run with: npm test
// When you replace the example feature, replace these tests with tests for yours.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_ITEM_LENGTH, addItem, removeItem, summarize } from '../public/lib/items.js';

test('adding an item puts it at the end, trimmed, without changing the old list', () => {
  const before = [{ id: 'a', text: 'Milk' }];
  const { items, error } = addItem(before, '  Bread  ', 'b');
  assert.equal(error, '');
  assert.deepEqual(items, [
    { id: 'a', text: 'Milk' },
    { id: 'b', text: 'Bread' },
  ]);
  assert.equal(before.length, 1, 'the original list must not change');
});

test('an empty item is not added and gives a friendly message', () => {
  const { items, error } = addItem([], '   ', 'x');
  assert.deepEqual(items, []);
  assert.equal(error, 'Please type something first.');
});

test('an item over the length limit is not added', () => {
  const { items, error } = addItem([], 'a'.repeat(MAX_ITEM_LENGTH + 1), 'x');
  assert.deepEqual(items, []);
  assert.match(error, /too long/);
});

test('a duplicate item (ignoring upper/lower case) is not added', () => {
  const { items, error } = addItem([{ id: 'a', text: 'Milk' }], 'MILK', 'b');
  assert.equal(items.length, 1);
  assert.equal(error, 'That is already on the list.');
});

test('removing an item keeps the others in order', () => {
  const list = [
    { id: 'a', text: 'One' },
    { id: 'b', text: 'Two' },
    { id: 'c', text: 'Three' },
  ];
  assert.deepEqual(removeItem(list, 'b'), [
    { id: 'a', text: 'One' },
    { id: 'c', text: 'Three' },
  ]);
});

test('the summary uses the right words for 0, 1 and many items', () => {
  assert.equal(summarize([]), 'No items yet');
  assert.equal(summarize([{ id: 'a', text: 'One' }]), '1 item');
  assert.equal(summarize([{ id: 'a', text: 'One' }, { id: 'b', text: 'Two' }]), '2 items');
});
