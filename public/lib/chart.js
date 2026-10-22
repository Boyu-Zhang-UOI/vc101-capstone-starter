// public/lib/chart.js: a small horizontal bar chart, drawn as SVG, with no libraries.
//
// Use it from public/app.js:
//
//   import { countBy, renderBarChart } from './lib/chart.js';
//   const rows = countBy(sessions, (s) => s.subject);          // [{ label, value }, ...]
//   renderBarChart(document.querySelector('#chart'), rows, { title: 'Sessions per subject' });
//
// Two kinds of code live here:
//   - countBy() and prepareBars() are pure functions (data in, data out). They are tested
//     in tests/chart.test.js. Most chart bugs are data bugs, so this is where tests pay off.
//   - renderBarChart() draws on the page. It only uses textContent and setAttribute, never
//     innerHTML, so labels that users typed can't inject code.

/** Turn a list of things into chart rows by counting them, e.g. sessions per subject. */
export function countBy(items, getLabel) {
  const counts = new Map();
  for (const item of items ?? []) {
    const label = String(getLabel(item) ?? '').trim() || '(none)';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].map(([label, value]) => ({ label, value }));
}

/**
 * Check and arrange chart rows before drawing.
 * - Rows whose value is not a number of 0 or more are left out (and counted in `skipped`).
 * - Long labels are shortened for the chart; the full text stays in `fullLabel`.
 * - With more than `maxBars` rows, the smallest are combined into one "Other" bar.
 * @param {{ label: string, value: number }[]} rows
 * @param {{ maxBars?: number, sort?: boolean, maxLabelLength?: number }} options
 */
export function prepareBars(rows, { maxBars = 10, sort = true, maxLabelLength = 20 } = {}) {
  const clean = [];
  let skipped = 0;
  for (const row of rows ?? []) {
    const value = typeof row?.value === 'number' ? row.value : Number.NaN;
    if (!Number.isFinite(value) || value < 0) {
      skipped++;
      continue;
    }
    clean.push({ fullLabel: String(row.label ?? '').trim() || '(none)', value });
  }
  if (sort) clean.sort((a, b) => b.value - a.value || a.fullLabel.localeCompare(b.fullLabel, 'en', { numeric: true }));

  let kept = clean;
  if (clean.length > maxBars) {
    const rest = clean.slice(maxBars - 1);
    kept = [...clean.slice(0, maxBars - 1), { fullLabel: `Other (${rest.length})`, value: sum(rest) }];
  }

  const max = Math.max(0, ...kept.map((bar) => bar.value));
  const bars = kept.map((bar) => ({
    label: bar.fullLabel.length > maxLabelLength ? bar.fullLabel.slice(0, maxLabelLength - 1) + '…' : bar.fullLabel,
    fullLabel: bar.fullLabel,
    value: bar.value,
    fraction: max > 0 ? bar.value / max : 0, // 0 to 1: how long the bar is compared with the longest
  }));
  return { bars, max, total: sum(kept), skipped };
}

/** A sentence describing the chart, for screen readers and as a text alternative. */
export function describeBars(bars, unit = '') {
  if (bars.length === 0) return 'No data yet.';
  const withUnit = (v) => `${formatNumber(v)}${unit ? ' ' + unit : ''}`;
  const list = bars.map((bar) => `${bar.fullLabel}: ${withUnit(bar.value)}`).join('; ');
  const top = bars.reduce((a, b) => (b.value > a.value ? b : a));
  return `Bar chart with ${bars.length} ${bars.length === 1 ? 'bar' : 'bars'}. ${list}. Highest: ${top.fullLabel}.`;
}

function sum(list) {
  return list.reduce((total, item) => total + item.value, 0);
}

function formatNumber(value) {
  return Number.isInteger(value) ? value.toLocaleString('en-US') : value.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

// ---------------------------------------------------------------- drawing (browser only)

const SVG = 'http://www.w3.org/2000/svg';
const ROW = 32; // height of one row, in pixels
const BAR = 20; // thickness of one bar
const RADIUS = 4; // rounded corners at the bar's end only

/**
 * Draw a bar chart inside `container` (any element, for example an empty <div>).
 * Call it again with new rows to redraw. Colors come from style.css (.chart-bar).
 * @param {Element} container
 * @param {{ label: string, value: number }[]} rows
 * @param {{ title?: string, unit?: string, maxBars?: number, sort?: boolean }} options
 */
export function renderBarChart(container, rows, { title = 'Bar chart', unit = '', ...options } = {}) {
  const { bars } = prepareBars(rows, options);
  const figure = document.createElement('figure');
  figure.className = 'chart';
  const caption = document.createElement('figcaption');
  caption.textContent = title;
  figure.append(caption);

  if (bars.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No data yet.';
    figure.append(empty);
    container.replaceChildren(figure);
    return;
  }

  const width = Math.max(280, Math.round(container.clientWidth || 560));
  const labelWidth = Math.min(160, Math.round(width * 0.38));
  const valueWidth = 64; // room for the number at the end of the longest bar
  const barSpace = width - labelWidth - valueWidth;
  const height = bars.length * ROW;

  const svg = el('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', class: 'chart-svg' });
  const svgTitle = el('title');
  svgTitle.textContent = title;
  const desc = el('desc');
  desc.textContent = describeBars(bars, unit);
  svg.append(svgTitle, desc);
  svg.setAttribute('aria-label', `${title}. ${desc.textContent}`);

  bars.forEach((bar, i) => {
    const y = i * ROW + (ROW - BAR) / 2;
    const length = Math.max(bar.value > 0 ? 2 : 0, bar.fraction * barSpace);
    const group = el('g');
    const tooltip = el('title'); // shown when you hover a bar
    tooltip.textContent = `${bar.fullLabel}: ${formatNumber(bar.value)}${unit ? ' ' + unit : ''}`;
    const label = el('text', { x: labelWidth - 8, y: y + BAR / 2, 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'chart-label' });
    label.textContent = bar.label;
    const shape = el('path', { d: barPath(labelWidth, y, length, BAR), class: 'chart-bar' });
    const value = el('text', { x: labelWidth + length + 6, y: y + BAR / 2, 'dominant-baseline': 'middle', class: 'chart-value' });
    value.textContent = formatNumber(bar.value);
    group.append(tooltip, label, shape, value);
    svg.append(group);
  });

  figure.append(svg);
  container.replaceChildren(figure);
}

/** A bar that is square at the baseline (left) and rounded at its end (right). */
function barPath(x, y, length, thickness) {
  if (length <= 0) return '';
  const r = Math.min(RADIUS, length, thickness / 2);
  return `M${x},${y} h${length - r} a${r},${r} 0 0 1 ${r},${r} v${thickness - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(length - r)} z`;
}

function el(name, attributes = {}) {
  const node = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}
