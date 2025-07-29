import { QueryExecuter } from '../queryExecutor/QueryExecutor';
import type { SQLBuildResult, SQLParams, SQLValues } from '../utils/types';
import { Database } from 'bun:sqlite';

export class InsertBuilder extends QueryExecuter {
  private table: string;
  private sqlValues: SQLValues = {};

  constructor(table: string, db: Database) {
    super(db);
    this.table = table;
  }

  values(sqlValues: SQLValues) {
    this.sqlValues = sqlValues;

    return this;
  }

  protected buildQuery(): SQLBuildResult {
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
      sql: `INSERT INTO ${this.table} (${columns.join(
        ','
      )}) VALUES (${Object.keys(params).join(',')})`,
      params: params,
    };
  }

  sql() {
    return this.buildQuery().sql;
  }
}
