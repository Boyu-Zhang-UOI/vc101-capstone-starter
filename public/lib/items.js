// public/lib/items.js: the logic for the example list feature.
//
// These are "pure" functions: they take data in and return new data, and never
// touch the page or localStorage. That makes them easy to test in Node
// (tests/items.test.js). Replace them with the logic of your own capstone.

/** The longest item (in characters) the list accepts. */
export const MAX_ITEM_LENGTH = 100;

/**
 * Add an item to the list.
 * Returns { items, error }: the new list (the old one is not changed) and '' or a friendly error.
 * @param {{ id: string, text: string }[]} items
 * @param {string} text
 * @param {string} id  a unique id for the new item
 */
export function addItem(items, text, id = crypto.randomUUID()) {
  const trimmed = String(text ?? '').trim();
  if (trimmed === '') {
    return { items, error: 'Please type something first.' };
  }
  if (trimmed.length > MAX_ITEM_LENGTH) {
    return { items, error: `That is too long. The limit is ${MAX_ITEM_LENGTH} characters.` };
  }
  const duplicate = items.some((item) => item.text.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) {
    return { items, error: 'That is already on the list.' };
  }
  return { items: [...items, { id, text: trimmed }], error: '' };
}

/** Return a new list without the item that has this id. */
export function removeItem(items, id) {
  return items.filter((item) => item.id !== id);
}

/** A short summary for the page, e.g. "No items yet", "1 item", "3 items". */
export function summarize(items) {
  if (items.length === 0) return 'No items yet';
  return items.length === 1 ? '1 item' : `${items.length} items`;
}
