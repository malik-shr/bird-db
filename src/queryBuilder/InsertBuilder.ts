import { QueryExecuter } from '../queryExecutor/QueryExecutor';
import type { SQLBuildResult, SQLParams } from '../utils/types';
import { Database } from 'bun:sqlite';

export class InsertBuilder extends QueryExecuter {
  private tables: string[];
  private sqlValues: SQLParams = {};

  constructor(tables: string[], db: Database) {
    super(db);
    this.tables = tables;
  }

  values(sqlValues: SQLParams) {
    this.sqlValues = sqlValues;

    return this;
  }

  protected build(): SQLBuildResult {
    let paramIndex = 0;
    const params: SQLParams = {};

    const columns = [];
    const values = [];

    for (const [column, value] of Object.entries(this.sqlValues)) {
      const paramIndexStr = `$${paramIndex}`;

      columns.push(column);
      values.push(value);

      params[paramIndexStr] = value;

      ++paramIndex;
    }

    return {
      sql: `INSERT INTO ${this.tables.join(', ')} (${columns.join(
        ','
      )}) VALUES (${Object.keys(params).join(',')})`,
      params: params,
    };
  }

  sql() {
    return this.build().sql;
  }
}
