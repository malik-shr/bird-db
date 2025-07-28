import type {
  SQLBuildResult,
  SQLOperator,
  SQLParams,
  SQLValue,
} from '../utils/types';

interface Condition {
  type: 'condition';
  field: string;
  operator: SQLOperator;
  value: SQLValue;
}

interface NullCondition {
  type: 'null';
  field: string;
  isNull: boolean;
}

interface GroupCondition {
  type: 'group';
  clause: WhereClause;
  groupOperator: 'AND' | 'OR';
}

type WhereCondition = Condition | NullCondition | GroupCondition;

export class WhereClause {
  private conditions: WhereCondition[] = [];
  private operator: 'AND' | 'OR' = 'AND'; // Default operator between conditions

  // Add a simple condition
  condition(field: string, operator: SQLOperator, value: SQLValue): this {
    // Validate operator and value combination
    this.validateCondition(operator, value);

    this.conditions.push({
      type: 'condition',
      field,
      operator,
      value,
    });
    return this;
  }

  // Handle special cases for NULL checks
  isNull(field: string): this {
    this.conditions.push({
      type: 'null',
      field,
      isNull: true,
    });
    return this;
  }

  isNotNull(field: string): this {
    this.conditions.push({
      type: 'null',
      field,
      isNull: false,
    });
    return this;
  }

  // Add nested group with AND logic
  and(callback: (nestedClause: WhereClause) => void): this {
    const nestedClause = new WhereClause();
    nestedClause.operator = 'AND';
    callback(nestedClause);

    this.conditions.push({
      type: 'group',
      clause: nestedClause,
      groupOperator: 'AND',
    });
    return this;
  }

  // Add nested group with OR logic
  or(callback: (nestedClause: WhereClause) => void): this {
    const nestedClause = new WhereClause();
    nestedClause.operator = 'OR';
    callback(nestedClause);

    this.conditions.push({
      type: 'group',
      clause: nestedClause,
      groupOperator: 'OR',
    });
    return this;
  }

  // Set the operator for this clause level
  useAnd(): this {
    this.operator = 'AND';
    return this;
  }

  useOr(): this {
    this.operator = 'OR';
    return this;
  }

  // Validate condition based on operator
  private validateCondition(operator: SQLOperator, value: SQLValue): void {
    switch (operator.toUpperCase()) {
      case 'IN':
      case 'NOT IN':
        if (!Array.isArray(value)) {
          throw new Error(`${operator} operator requires an array value`);
        }
        if (value.length === 0) {
          throw new Error(`${operator} operator requires a non-empty array`);
        }
        break;

      case 'BETWEEN':
      case 'NOT BETWEEN':
        if (!Array.isArray(value) || value.length !== 2) {
          throw new Error(
            `${operator} operator requires an array with exactly 2 values`
          );
        }
        break;

      case 'EXISTS':
      case 'NOT EXISTS':
        if (typeof value !== 'string') {
          throw new Error(`${operator} operator requires a string (subquery)`);
        }
        break;
    }
  }

  getParams(): SQLParams {
    const params: SQLParams = {};

    return params;
  }

  toSQL(startingIndex = 0): SQLBuildResult {
    let paramIndex = startingIndex;
    let params: SQLParams = {};

    if (this.conditions.length === 0) {
      return { sql: '', params };
    }

    const sqlParts = this.conditions
      .map((condition) => {
        switch (condition.type) {
          case 'condition': {
            const result = this.formatCondition(condition, paramIndex);
            paramIndex += result.paramCount;
            params = { ...params, ...result.params };
            return result.sql;
          }
          case 'null':
            return `${condition.field} IS ${
              condition.isNull ? '' : 'NOT '
            }NULL`;
          case 'group': {
            const group = condition.clause.toSQL(paramIndex);
            paramIndex += Object.keys(group.params).length;
            params = { ...params, ...group.params };
            return group.sql ? `(${group.sql})` : '';
          }
          default:
            return '';
        }
      })
      .filter(Boolean);

    return {
      sql: sqlParts.join(` ${this.operator} `),
      params,
    };
  }

  private formatCondition(
    condition: Condition,
    paramStartIndex: number
  ): {
    sql: string;
    params: SQLParams;
    paramCount: number;
  } {
    const { field, operator, value } = condition;
    const op = operator.toUpperCase();

    if ((op === 'BETWEEN' || op === 'NOT BETWEEN') && Array.isArray(value)) {
      return {
        sql: `${field} ${op} $${paramStartIndex} AND $${paramStartIndex + 1}`,
        params: {
          [`$${paramStartIndex}`]: value[0],
          [`$${paramStartIndex + 1}`]: value[1],
        },
        paramCount: 2,
      };
    }

    if ((op === 'EXISTS' || op === 'NOT EXISTS') && typeof value === 'string') {
      return {
        sql: `${op} (${value})`,
        params: {},
        paramCount: 0,
      };
    }

    if (Array.isArray(value)) {
      const placeholders = value
        .map((_, i) => `$${paramStartIndex + i}`)
        .join(', ');

      const paramMap: Record<string, SQLValue> = {};
      value.forEach((v, i) => {
        paramMap[`$${paramStartIndex + i}`] = v;
      });

      return {
        sql: `${field} ${op} (${placeholders})`,
        params: paramMap,
        paramCount: value.length,
      };
    }

    return {
      sql: `${field} ${op} $${paramStartIndex}`,
      params: {
        [`$${paramStartIndex}`]: value,
      },
      paramCount: 1,
    };
  }
}
