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
import type { SelectField } from '../utils/sqlFunctions';
import { WhereClause, type InputCondition } from './WhereClause';

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
    this.selectFields = selectFields.map((selectField) => {
      if (typeof selectField === 'string') {
        return quoteColumn(selectField);
      } else if (selectField instanceof SelectStatement) {
        const newSelectField = new SelectStatement(
          selectField.selectFields,
          db,
          this.paramContext
        );
        return newSelectField.sql();
      } else if (selectField.type !== null) {
        if (selectField.type === 'function') {
          return selectField.sql;
        }
      }
      throw Error('Invalid field format');
    });
  }

  from(...tables: string[]): this {
    if (tables.length === 0) {
      throw Error('No fromTable provided');
    }

    this.fromTables = tables.map((table) => {
      return quoteTable(table);
    });

    return this;
  }

  /** function that accepts where clause */
  where(...conditions: readonly InputCondition[]) {
    const whereClause = new WhereClause(conditions, this.paramContext);
    this.whereClauses.push(whereClause);

    for (const condition of conditions) {
      if (condition instanceof SelectStatement) {
        //condition.build();
        condition.params = this.params;
      }
    }
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

  protected build(): SQLBuildResult {
    if (this.selectFields.length === 0) {
      throw new Error('SELECT fields are required');
    }

    if (this.fromTables.length === 0) {
      throw new Error('FROM table is required');
    }

    let sql = `SELECT ${this.selectFields.join(
      ', '
    )} FROM ${this.fromTables.join(', ')}`;

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

    console.log(this.paramContext.getParameters());
    return { sql, params: this.paramContext.getParameters() };
  }
}
