import type { CancellationRule } from '@/types';

let idCounter = 0;
function newId() {
  idCounter += 1;
  return `rule-${Date.now()}-${idCounter}`;
}

export function makeRule(): CancellationRule {
  return { id: newId(), hours_before: 0, refund_percentage: 0 };
}

/** Validation errors keyed by `${rule.id}.field`. Empty object == valid. */
export function validateRules(rules: CancellationRule[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const seenHours = new Set<number>();
  rules.forEach((r) => {
    if (r.hours_before < 0) errors[`${r.id}.hours`] = 'Must be ≥ 0';
    if (seenHours.has(r.hours_before)) errors[`${r.id}.hours`] = 'Duplicate hours';
    seenHours.add(r.hours_before);
    if (r.refund_percentage < 0 || r.refund_percentage > 100)
      errors[`${r.id}.refund`] = '0–100 only';
  });
  return errors;
}
