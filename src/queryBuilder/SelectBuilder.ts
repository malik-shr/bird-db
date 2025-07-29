import type {
  JoinCondition,
  OrderCondition,
  OrderDirection,
  SQLBuildResult,
} from '../utils/types';
import { WhereClause, type InputCondition } from './WhereClause';
import { Database } from 'bun:sqlite';
import { QueryExecuter } from '../queryExecutor/QueryExecutor';
import { ParameterContext } from '../utils/ParamContext';

export class SelectQueryBuilder extends QueryExecuter {
  private selectFields: string[] = [];
  private fromTable: string[] = [];
  private whereClauses: WhereClause[] = [];
  private paramContext: ParameterContext;
  private joinConditions: JoinCondition[] = [];
  private orderConditions: OrderCondition[] = [];

  constructor(selectFields: string[], db: Database) {
    super(db);
    this.selectFields = selectFields;
    this.paramContext = new ParameterContext();
  }

  select(fields: string | string[]): this {
    this.selectFields = Array.isArray(fields) ? fields : [fields];
    return this;
  }

  from(tables: string | string[]): this {
    this.fromTable = Array.isArray(tables) ? tables : [tables];
    return this;
  }

  // Main where method - accepts a WhereClause or callback function
  where(...conditions: readonly InputCondition[]) {
    const whereClause = new WhereClause(conditions, this.paramContext);
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

  protected build(): SQLBuildResult {
    if (this.selectFields.length === 0) {
      throw new Error('SELECT fields are required');
    }

    if (this.fromTable.length === 0) {
      throw new Error('FROM table is required');
    }

    let sql = `SELECT ${this.selectFields.join(
      ', '
    )} FROM ${this.fromTable.join(', ')}`;

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

    return { sql, params: this.paramContext.getParameters() };
  }

  sql() {
    return this.build().sql;
  }
}
