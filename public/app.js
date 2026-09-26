// public/app.js: runs in the visitor's browser. Everything in public/ is PUBLIC,
// so there are no keys or secrets here. This file only connects the page to the
// logic in public/lib/ and to our own server route /api/ask.
//
// It contains two EXAMPLE features. Keep, change or delete them as your capstone grows.

import { addItem, removeItem, summarize } from './lib/items.js';
import { MAX_INPUT_LENGTH, checkInput, counterText } from './lib/input.js';

// ---------- Example feature 1: a list saved in this browser (localStorage) ----------

const STORAGE_KEY = 'capstone-items';
const itemForm = document.querySelector('#item-form');
const itemText = document.querySelector('#item-text');
const itemMessage = document.querySelector('#item-message');
const itemList = document.querySelector('#item-list');
const itemSummary = document.querySelector('#item-summary');

let items = loadItems();
renderItems();

itemForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = addItem(items, itemText.value);
  showMessage(itemMessage, result.error, Boolean(result.error));
  if (result.error) return;
  items = result.items;
  saveItems();
  renderItems();
  itemText.value = '';
  itemText.focus();
});

function renderItems() {
  itemList.replaceChildren();
  for (const item of items) {
    const li = document.createElement('li');
    const text = document.createElement('span');
    text.textContent = item.text; // textContent, never innerHTML, for anything a user typed
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'link';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${item.text}`);
    remove.addEventListener('click', () => {
      items = removeItem(items, item.id);
      saveItems();
      renderItems();
    });
    li.append(text, ' ', remove);
    itemList.append(li);
  }
  itemSummary.textContent = summarize(items);
}

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return []; // bad or missing data: start with an empty list
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ---------- Example feature 2 (optional): ask the AI through our server route ----------

const askForm = document.querySelector('#ask-form');
const questionBox = document.querySelector('#question');
const counter = document.querySelector('#counter');
const askButton = document.querySelector('#ask-button');
const askStatus = document.querySelector('#ask-status');
const answer = document.querySelector('#answer');

questionBox.maxLength = MAX_INPUT_LENGTH;
counter.textContent = counterText('');
questionBox.addEventListener('input', () => {
  counter.textContent = counterText(questionBox.value);
});

askForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const problem = checkInput(questionBox.value);
  if (problem) {
    showMessage(askStatus, problem, true);
    return;
  }
  askButton.disabled = true;
  showMessage(askStatus, 'Asking the AI…');
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: questionBox.value }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showMessage(askStatus, data.error || `Something went wrong (error ${response.status}).`, true);
      return;
    }
    answer.textContent = data.reply;
    answer.hidden = false;
    showMessage(askStatus, '');
  } catch {
    showMessage(askStatus, 'Could not reach the server. Check your connection and try again.', true);
  } finally {
    askButton.disabled = false;
  }
});

// ---------- Shared helper ----------

function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle('error', isError);
}
