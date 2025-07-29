import type {
  ColumnReference,
  InputCondition,
  ReferenceCondition,
} from '../queryBuilder/WhereClause';
import type { ComparisonOperator } from '../utils/types';

type RefConditions = [string, ComparisonOperator, string];

// Helper functions to create logical operators and column references
export function or(...conditions: InputCondition[]) {
  return { type: 'OR', conditions } as const;
}

export function and(...conditions: InputCondition[]) {
  return { type: 'AND', conditions } as const;
}

export function ref(column: string): ColumnReference {
  if (typeof column !== 'string' || column.trim() === '') {
    throw new Error('Column reference must be a non-empty string');
  }
  return { type: 'COLUMN_REF', column } as const;
}

// Convenience function for creating reference conditions
export function whereRef(refConditions: RefConditions): ReferenceCondition {
  return [refConditions[0], refConditions[1], ref(refConditions[1])];
}

export function whereRaw(rawCondition: string) {
  return '';
}
