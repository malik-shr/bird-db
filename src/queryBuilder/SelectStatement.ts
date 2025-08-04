import type {
  JoinCondition,
  OrderCondition,
  OrderDirection,
  SQLBuildResult,
} from '../utils/types';

import { Database } from 'bun:sqlite';
import { QueryExecuter } from '../queryExecutor/QueryExecutor';
import { ParameterContext } from '../utils/ParamContext';
import { quoteColumn, quoteTable } from '../utils/utils';
import type { FunctionType } from '../utils/sqlFunctions';
import {
  WhereClause,
  type InputCondition,
  type SubqueryCondition,
} from './WhereClause';

export type SelectField = string | FunctionType<SelectStatement> | SelectStatement;

export class SelectStatement extends QueryExecuter {
  selectFields: SelectField[] = [];
  paramContext: ParameterContext;

  private fromTables: string[] = [];
  private whereClauses: WhereClause[] = [];

  private joinConditions: JoinCondition[] = [];
  private orderConditions: OrderCondition[] = [];
  private alias: string | null = null;

  constructor(
    selectFields: SelectField[],
    db: Database,
    paramContext: ParameterContext = new ParameterContext()
  ) {
    super(db);
    this.paramContext = paramContext;
    this.selectFields = selectFields;
  }

  from(...tables: string[]): this {
    if (tables.length === 0) {
      throw Error('No fromTable provided');
    }

    this.fromTables = tables;

    return this;
  }

  /** function that accepts where clause */
  where(...conditions: readonly InputCondition[]) {
    const whereConditions = conditions.map((condition) => {
      if (Array.isArray(condition) && condition[0] instanceof SelectStatement) {
        const newSelectField = this.clone(condition[0]);
        return [
          newSelectField,
          condition[1],
          condition[2],
        ] as SubqueryCondition;
      }

      return condition;
    });

    const whereClause = new WhereClause(whereConditions, this.paramContext);
    this.whereClauses.push(whereClause);

    return this;
  }

  join(table: string, c1: string, c2: string) {
    this.joinConditions.push({ table, c1, c2, operator: 'JOIN' });

    return this;
  }

  innerJoin(table: string, c1: string, c2: string) {
    this.joinConditions.push({ table, c1, c2, operator: 'INNER JOIN' });

    return this;
  }

  leftJoin(table: string, c1: string, c2: string) {
    this.joinConditions.push({ table, c1, c2, operator: 'LEFT JOIN' });

    return this;
  }

  rightJoin(table: string, c1: string, c2: string) {
    this.joinConditions.push({ table, c1, c2, operator: 'RIGHT JOIN' });

    return this;
  }

  fullJoin(table: string, c1: string, c2: string) {
    this.joinConditions.push({ table, c1, c2, operator: 'FULL JOIN' });

    return this;
  }

  orderBy(column: string, orderDirection: OrderDirection = 'DESC') {
    this.orderConditions = [
      ...this.orderConditions,
      { column: column, direction: orderDirection },
    ];

    return this;
  }

  as(alias: string) {
    this.alias = alias;

    return this;
  }

  clone(statement: SelectStatement): SelectStatement {
    const newSelectField = new SelectStatement(
      // Clone the select fields to avoid sharing references
      statement.selectFields.map((field) => {
        if (field instanceof SelectStatement) {
          return this.clone(field); // Recursively clone nested subqueries
        }
        return field;
      }),
      this.db,
      this.paramContext
    ).from(...statement.fromTables);

    // Deep clone where clauses instead of sharing references
    newSelectField.whereClauses = statement.whereClauses.map((clause) => {
      // You might need to implement a clone method on WhereClause
      // For now, create new WhereClause instances
      return new WhereClause(clause.conditions, this.paramContext);
    });

    newSelectField.alias = statement.alias;
    newSelectField.joinConditions = [...statement.joinConditions];
    newSelectField.orderConditions = [...statement.orderConditions];

    return newSelectField;
  }

  protected build(): SQLBuildResult {
    if (this.selectFields.length === 0) {
      throw new Error('SELECT fields are required');
    }

    const fieldsSql = this.selectFields.map((field) => {
      if (typeof field === 'string') {
        return quoteColumn(field);
      } else if (field instanceof SelectStatement) {
        const newSelectField = this.clone(field);

        return `${newSelectField.sql()}`; // wrap subquery
      } else if (typeof field === 'object' && field.type === 'function') {
        return field.sql;
      }

      throw new Error('Invalid select field');
    });

    const quotedTables = this.fromTables.map((table) => {
      return quoteTable(table);
    });

    if (quotedTables.length === 0) {
      throw new Error('FROM table is required');
    }

    let sql = `SELECT ${fieldsSql.join(', ')} FROM ${quotedTables.join(', ')}`;

    if (this.joinConditions.length > 0) {
      const joinConditions = this.joinConditions.map((joinCondition) => {
        return `${joinCondition.operator} ${joinCondition.table} ON ${joinCondition.c1} = ${joinCondition.c2}`;
      });
      sql += ` ${joinConditions.join(' ')}`;
    }

    if (this.whereClauses.length > 0) {
      const whereClauses = this.whereClauses.map((whereClause) => {
        const build = whereClause.build();
        return build.sql;
      });

      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    if (this.orderConditions.length > 0) {
      const orderConditions = this.orderConditions.map((orderCondition) => {
        return `${orderCondition.column} ${orderCondition.direction}`;
      });

      sql += ` ORDER BY ${orderConditions.join(', ')}`;
    }

    if (this.alias) {
      sql = `(${sql}) AS "${this.alias}"`;
    }

    return { sql, params: this.paramContext.getParameters() };
  }
}
