// Tests for the data side of the chart helper in public/lib/chart.js.
// (Drawing needs a browser, so we test the data that goes into the drawing.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countBy, describeBars, prepareBars } from '../public/lib/chart.js';

test('countBy counts items per label', () => {
  const sessions = [{ subject: 'Biology' }, { subject: 'Spanish' }, { subject: 'Biology' }, { subject: '  ' }];
  assert.deepEqual(countBy(sessions, (s) => s.subject), [
    { label: 'Biology', value: 2 },
    { label: 'Spanish', value: 1 },
    { label: '(none)', value: 1 },
  ]);
  assert.deepEqual(countBy([], (s) => s.subject), []);
});

test('prepareBars sorts biggest first and scales bars to the biggest value', () => {
  const { bars, max, total } = prepareBars([
    { label: 'Spanish', value: 40 },
    { label: 'Biology', value: 80 },
    { label: 'Statistics', value: 0 },
  ]);
  assert.deepEqual(bars.map((b) => [b.label, b.fraction]), [['Biology', 1], ['Spanish', 0.5], ['Statistics', 0]]);
  assert.equal(max, 80);
  assert.equal(total, 120);
});

test('prepareBars leaves out values that are not numbers of 0 or more', () => {
  const { bars, skipped } = prepareBars([
    { label: 'ok', value: 3 },
    { label: 'text', value: '5' },
    { label: 'negative', value: -1 },
    { label: 'missing' },
    { label: 'nan', value: Number.NaN },
    null,
  ]);
  assert.deepEqual(bars.map((b) => b.label), ['ok']);
  assert.equal(skipped, 5);
});

test('prepareBars handles no data and all-zero data without dividing by zero', () => {
  assert.deepEqual(prepareBars([]).bars, []);
  assert.deepEqual(prepareBars(undefined).bars, []);
  assert.deepEqual(prepareBars([{ label: 'a', value: 0 }]).bars[0].fraction, 0);
});

test('prepareBars combines the smallest rows into "Other" when there are too many', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ label: `Item ${i + 1}`, value: 12 - i }));
  const { bars, total } = prepareBars(rows, { maxBars: 5 });
  assert.equal(bars.length, 5);
  assert.deepEqual(bars[4], { label: 'Other (8)', fullLabel: 'Other (8)', value: 36, fraction: 1 }); // 8 + 7 + … + 1, always last
  assert.equal(total, 78, 'nothing is lost when rows are combined');
});

test('prepareBars shortens long labels but keeps the full text', () => {
  const [bar] = prepareBars([{ label: 'A very long subject name indeed', value: 1 }], { maxLabelLength: 10 }).bars;
  assert.equal(bar.label, 'A very lo…');
  assert.equal(bar.fullLabel, 'A very long subject name indeed');
});

test('describeBars gives a text alternative for screen readers', () => {
  const { bars } = prepareBars([{ label: 'Biology', value: 95 }, { label: 'Spanish', value: 40 }]);
  assert.equal(describeBars(bars, 'min'), 'Bar chart with 2 bars. Biology: 95 min; Spanish: 40 min. Highest: Biology.');
  assert.equal(describeBars([]), 'No data yet.');
});
