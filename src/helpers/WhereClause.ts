import { ParameterContext } from '../utils/ParamContext';
import type {
  ComparisonOperator,
  ListOperator,
  NullOperator,
  SqlOperator,
  SQLParams,
  SQLValue,
} from '../utils/types';

// Operator types
type ListValue = readonly SQLValue[];

// Column reference type
export interface ColumnReference {
  readonly type: 'COLUMN_REF';
  readonly column: string;
}

// Reference condition types (column to column comparisons)
export type ReferenceCondition = [string, ComparisonOperator, ColumnReference];

// Simple condition types
export type SimpleCondition<T extends SqlOperator = SqlOperator> =
  T extends ListOperator
    ? [string, T, ListValue]
    : T extends NullOperator
    ? [string, T]
    : [string, T, SQLValue];

// Logical operator types
export interface LogicalOperator {
  readonly type: 'AND' | 'OR';
  readonly conditions: readonly InputCondition[];
}

// Input condition union type
export type InputCondition =
  | SimpleCondition
  | ReferenceCondition
  | LogicalOperator;

// Parsed condition types (internal representation)
interface ParsedSimpleCondition {
  readonly type: 'SIMPLE';
  readonly field: string;
  readonly operator: SqlOperator;
  readonly value?: SQLValue | ListValue;
}

interface ParsedReferenceCondition {
  readonly type: 'REFERENCE';
  readonly field: string;
  readonly operator: ComparisonOperator;
  readonly refColumn: string;
}

interface ParsedLogicalCondition {
  readonly type: 'AND' | 'OR';
  readonly conditions: readonly ParsedCondition[];
}

type ParsedCondition =
  | ParsedSimpleCondition
  | ParsedReferenceCondition
  | ParsedLogicalCondition;
type ParsedConditions = readonly ParsedCondition[];

interface QueryResult {
  readonly sql: string;
  readonly params: SQLParams;
}

export class WhereClause {
  private conditions: readonly InputCondition[];
  private paramContext: ParameterContext;

  constructor(
    conditions: readonly InputCondition[],
    paramContext: ParameterContext
  ) {
    this.conditions = conditions;
    this.paramContext = paramContext;
  }

  build(): QueryResult {
    const parsedConditions = this.parseConditions(this.conditions);
    const whereClause = this.buildWhereConditions(
      parsedConditions,
      this.paramContext
    );

    let query = '';

    if (whereClause) {
      query += `(${whereClause})`;
    }

    return {
      sql: query,
      params: this.paramContext.getParameters(),
    };
  }
  // Type guard functions
  isLogicalOperator(condition: InputCondition): condition is LogicalOperator {
    return (
      typeof condition === 'object' &&
      'type' in condition &&
      (condition.type === 'AND' || condition.type === 'OR')
    );
  }

  isSimpleCondition(condition: InputCondition): condition is SimpleCondition {
    return (
      Array.isArray(condition) &&
      condition.length >= 2 &&
      (condition.length === 2 || !this.isColumnReference(condition[2]))
    );
  }

  isReferenceCondition(
    condition: InputCondition
  ): condition is ReferenceCondition {
    return (
      Array.isArray(condition) &&
      condition.length === 3 &&
      typeof condition[1] === 'string' &&
      this.isColumnReference(condition[2])
    );
  }

  isColumnReference(value: any): value is ColumnReference {
    return (
      typeof value === 'object' && value !== null && value.type === 'COLUMN_REF'
    );
  }

  isNullOperator(operator: SqlOperator): operator is NullOperator {
    return operator === 'IS NULL' || operator === 'IS NOT NULL';
  }

  isListOperator(operator: SqlOperator): operator is ListOperator {
    return operator === 'IN' || operator === 'NOT IN';
  }

  // Validation functions
  validateSimpleCondition(condition: SimpleCondition): void {
    const [field, operator, value] = condition;

    if (typeof field !== 'string' || field.trim() === '') {
      throw new Error('Field name must be a non-empty string');
    }

    if (this.isNullOperator(operator)) {
      if (condition.length !== 2) {
        throw new Error(`${operator} operator should not have a value`);
      }
    } else if (this.isListOperator(operator)) {
      if (!Array.isArray(value)) {
        throw new Error(`${operator} operator requires an array value`);
      }
      if (value.length === 0) {
        throw new Error(`${operator} operator requires a non-empty array`);
      }
    } else {
      if (condition.length !== 3) {
        throw new Error(`${operator} operator requires a value`);
      }
    }
  }

  parseConditions(conditions: readonly InputCondition[]): ParsedConditions {
    return conditions.map((condition) => this.parseCondition(condition));
  }

  parseCondition(condition: InputCondition): ParsedCondition {
    if (this.isLogicalOperator(condition)) {
      return {
        type: condition.type,
        conditions: this.parseConditions(condition.conditions),
      };
    }

    if (this.isReferenceCondition(condition)) {
      const [field, operator, columnRef] = condition;

      if (typeof field !== 'string' || field.trim() === '') {
        throw new Error('Field name must be a non-empty string');
      }

      // Only comparison operators are allowed for column references
      const validOperators: ComparisonOperator[] = [
        '=',
        '!=',
        '<>',
        '>',
        '<',
        '>=',
        '<=',
      ];
      if (!validOperators.includes(operator)) {
        throw new Error(
          `Invalid operator for column reference: ${operator}. Only comparison operators are allowed.`
        );
      }

      return {
        type: 'REFERENCE',
        field,
        operator,
        refColumn: columnRef.column,
      };
    }

    if (this.isSimpleCondition(condition)) {
      this.validateSimpleCondition(condition);

      const [field, operator] = condition;

      // Construct the object properly based on operator type
      if (this.isNullOperator(operator)) {
        return {
          type: 'SIMPLE',
          field,
          operator,
        } as const;
      } else {
        return {
          type: 'SIMPLE',
          field,
          operator,
          value: condition[2],
        } as const;
      }
    }

    throw new Error(`Invalid condition format: ${JSON.stringify(condition)}`);
  }

  // Build WHERE conditions from parsed conditions
  buildWhereConditions(
    parsedConditions: ParsedConditions,
    paramContext: ParameterContext
  ): string {
    if (parsedConditions.length === 0) return '';

    const parts = parsedConditions.map((condition) => {
      switch (condition.type) {
        case 'SIMPLE':
          return this.buildSimpleCondition(condition, paramContext);

        case 'REFERENCE':
          return this.buildReferenceCondition(condition);

        case 'AND': {
          const andParts = condition.conditions.map((c) =>
            this.buildWhereConditions([c], paramContext)
          );
          return `(${andParts.join(' AND ')})`;
        }

        case 'OR': {
          const orParts = condition.conditions.map((c) =>
            this.buildWhereConditions([c], paramContext)
          );
          return `(${orParts.join(' OR ')})`;
        }

        default:
          // TypeScript exhaustiveness check
          const _exhaustive: never = condition;
          throw new Error(
            `Unknown condition type: ${JSON.stringify(_exhaustive)}`
          );
      }
    });

    return parts.filter(Boolean).join(' AND ');
  }

  // Build reference condition (column to column comparison)
  buildReferenceCondition(condition: ParsedReferenceCondition): string {
    const { field, operator, refColumn } = condition;
    return `${field} ${operator} ${refColumn}`;
  }

  // Build simple condition (field operator value)
  buildSimpleCondition(
    condition: ParsedSimpleCondition,
    paramContext: ParameterContext
  ): string {
    const { field, operator, value } = condition;

    switch (operator) {
      case '=':
      case '!=':
      case '<>':
      case '>':
      case '<':
      case '>=':
      case '<=':
      case 'LIKE':
      case 'NOT LIKE':
        if (value === undefined) {
          throw new Error(`${operator} operator requires a value`);
        }
        const paramPlaceholder = paramContext.addParameter(value as SQLValue);
        return `${field} ${operator} ${paramPlaceholder}`;

      case 'IN':
      case 'NOT IN': {
        if (!Array.isArray(value)) {
          throw new Error(`${operator} operator requires an array value`);
        }
        const placeholders = value.map((v) => paramContext.addParameter(v));
        return `${field} ${operator} (${placeholders.join(', ')})`;
      }

      case 'IS NULL':
      case 'IS NOT NULL':
        return `${field} ${operator}`;

      default:
        // TypeScript exhaustiveness check
        const _exhaustive: never = operator;
        throw new Error(`Unsupported operator: ${_exhaustive}`);
    }
  }
}
