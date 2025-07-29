import type { SQLBuildResult, SQLParams } from '../utils/types';
import { Database } from 'bun:sqlite';
import { QueryExecuter } from '../queryExecutor/QueryExecutor';
import { ParameterContext } from '../utils/ParamContext';
import { WhereClause, type InputCondition } from './WhereClause';

export class UpdateBuilder extends QueryExecuter {
  private tables: string[] = [];
  private whereClauses: WhereClause[] = [];
  private paramContext: ParameterContext;
  private sqlValues: SQLParams = {};

  constructor(tables: string[], db: Database) {
    super(db);
    this.tables = tables;
    this.paramContext = new ParameterContext();
  }

  set(sqlValues: SQLParams) {
    this.sqlValues = sqlValues;
  }

  where(...conditions: readonly InputCondition[]) {
    const whereClause = new WhereClause(conditions, this.paramContext);
    this.whereClauses.push(whereClause);

    return this;
  }

  protected build(): SQLBuildResult {
    if (this.tables.length === 0) {
      throw new Error('FROM table is required');
    }

    let params: SQLParams = {};

    let paramIndex = 0;

    const setValues: string[] = [];

    for (const [column, value] of Object.entries(this.sqlValues)) {
      const paramIndexStr = `$${paramIndex}`;

      setValues.push(`${column} = ${paramIndexStr}`);
      params[paramIndexStr] = value;
      ++paramIndex;
    }

    let sql = `UPDATE ${this.tables.join(', ')} SET ${setValues.join(',')}`;

    if (this.whereClauses.length > 0) {
      const whereClauses = this.whereClauses.map((whereClause) => {
        const build = whereClause.build();
        return build.sql;
      });

      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    return { sql, params };
  }

  sql() {
    return this.build().sql;
  }
}
