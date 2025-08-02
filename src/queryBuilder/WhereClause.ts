import { SelectStatement } from './SelectStatement';
import { ParameterContext } from '../utils/ParamContext';
import type { SQLBuildResult, SQLOperator, SQLValue } from '../utils/types';
import { quoteColumn } from '../utils/utils';
import type { FunctionType } from '../utils/sqlFunctions';

export type ColumnReference = {
  type: 'REF';
  column: string;
};

type Raw = string;
export type ComparisonOperator = '=' | '!=' | '<>' | '>' | '<' | '>=' | '<=';
type LikeOperator = 'LIKE';
type NullOperator = 'IS NULL' | 'IS NOT NULL';
type InOperator = 'IN' | 'NOT IN';

type ValueComparison = [string, ComparisonOperator, SQLValue];
type NullComparision = [string, NullOperator];
type LikeComparison = [string, LikeOperator, string];
type InComparision = [string, InOperator, string[]];

type SimpleCondition =
  | ValueComparison
  | NullComparision
  | LikeComparison
  | InComparision
  | Raw;

export type ReferenceCondition = [string, ComparisonOperator, ColumnReference];
export type SubqueryCondition = [SelectStatement, ComparisonOperator, SQLValue];
type LogicalCondition = {
  readonly type: 'AND' | 'OR';
  readonly conditions: readonly InputCondition[];
};

export type InputCondition =
  | SimpleCondition
  | ReferenceCondition
  | SubqueryCondition
  | LogicalCondition;

export class WhereClause {
  conditions: readonly InputCondition[];
  paramContext: ParameterContext;

  constructor(
    conditions: readonly InputCondition[],
    paramContext: ParameterContext
  ) {
    this.conditions = conditions;
    this.paramContext = paramContext;
  }

  buildWhereStatement(condition: InputCondition): string {
    if (this.isSimpleCondition(condition)) {
      if (this.isValueComparison(condition)) {
        const [column, oparator, value] = condition;

        return `${quoteColumn(
          column
        )} ${oparator} ${this.paramContext.addParameter(value)}`;
      } else if (this.isInComparison(condition)) {
        const [column, operator, values] = condition;

        const paramsPlaceHolder = values.map((value) => {
          return this.paramContext.addParameter(value);
        });

        return `${quoteColumn(column)} ${operator} (${paramsPlaceHolder.join(
          ', '
        )})`;
      } else if (this.isNullComparison(condition)) {
        const [column, operator] = condition;

        return `${quoteColumn(column)} ${operator}`;
      } else if (this.isLikeComparison(condition)) {
        const [column, operator, pattern] = condition;

        return `${quoteColumn(column)} ${operator} '${pattern}'`;
      } else {
        throw Error('Unsupported condition');
      }
    } else if (this.isReferenceCondition(condition)) {
      const [column, operator, refColumn] = condition;

      return `${quoteColumn(column)} ${operator} ${quoteColumn(
        refColumn.column
      )}`;
    } else if (this.isSubQueryCondition(condition)) {
      const [subquery, operator, value] = condition;
      const paramStr = this.paramContext.addParameter(value);

      return `(${subquery.sql()}) ${operator} ${paramStr}`;
    } else if (this.isRaw(condition)) {
      return condition;
    } else if (this.isLogicalCondition(condition)) {
      const parts = condition.conditions.map((c) => {
        return this.buildWhereStatement(c);
      });
      return `(${parts.join(` ${condition.type} `)})`;
    }

    throw Error('Unsupported Where clause');
  }

  build(): SQLBuildResult {
    const parts = this.conditions.map((condition) => {
      return this.buildWhereStatement(condition);
    });

    return {
      sql: parts.join(' AND '),
      params: this.paramContext.getParameters(),
    };
  }
  private isSqlOperator(operator: string): operator is SQLOperator {
    const operators = [
      '=',
      '!=',
      '<>',
      '>',
      '<',
      '>=',
      '<=',
      'LIKE',
      'IS NULL',
      'IS NOT NULL',
    ];

    return operators.includes(operator);
  }

  private isComparisonOperator(
    operator: string
  ): operator is ComparisonOperator {
    const operators = ['=', '!=', '<>', '>', '<', '>=', '<='];

    return operators.includes(operator);
  }

  private isSQLValue(value: any): value is SQLValue {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === null
    );
  }

  private isSimpleCondition(
    condition: InputCondition
  ): condition is SimpleCondition {
    return (
      Array.isArray(condition) &&
      condition.length >= 2 &&
      typeof condition[0] === 'string' &&
      !this.isColumnReference(condition[2])
    );
  }

  private isValueComparison(
    condition: SimpleCondition
  ): condition is ValueComparison {
    return (
      condition.length === 3 &&
      this.isComparisonOperator(condition[1]) &&
      this.isSQLValue(condition[2])
    );
  }

  private isLikeComparison(
    condition: SimpleCondition
  ): condition is LikeComparison {
    return (
      condition.length === 3 &&
      condition[1] === 'LIKE' &&
      typeof condition[2] === 'string'
    );
  }

  private isNullComparison(
    condition: SimpleCondition
  ): condition is NullComparision {
    return (
      condition.length === 2 &&
      (condition[1] === 'IS NULL' || condition[1] === 'IS NOT NULL')
    );
  }

  private isInComparison(
    condition: SimpleCondition
  ): condition is InComparision {
    return (
      condition.length === 3 &&
      condition[1] === 'IN' &&
      Array.isArray(condition[2])
    );
  }

  private isSubQueryCondition(
    condition: InputCondition
  ): condition is SubqueryCondition {
    return (
      Array.isArray(condition) &&
      condition.length === 3 &&
      condition[0] instanceof SelectStatement &&
      this.isSqlOperator(condition[1]) &&
      this.isSQLValue(condition[2])
    );
  }

  private isColumnReference(value: any): value is ColumnReference {
    return typeof value === 'object' && value !== null && value.type === 'REF';
  }

  private isReferenceCondition(
    condition: InputCondition
  ): condition is ReferenceCondition {
    return (
      Array.isArray(condition) &&
      condition.length === 3 &&
      typeof condition[0] === 'string' &&
      this.isSqlOperator(condition[1]) &&
      this.isColumnReference(condition[2])
    );
  }

  private isLogicalCondition(
    condition: InputCondition
  ): condition is LogicalCondition {
    return (
      typeof condition === 'object' &&
      condition !== null &&
      'type' in condition &&
      (condition.type === 'AND' || condition.type === 'OR') &&
      Array.isArray(condition.conditions)
    );
  }

  private isRaw(condition: InputCondition) {
    return typeof condition === 'string';
  }
}
