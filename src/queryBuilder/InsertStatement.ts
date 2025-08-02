import { quoteColumn, quoteTable } from '../utils/utils';
import { QueryExecuter } from '../queryExecutor/QueryExecutor';
import { ParameterContext } from '../utils/ParamContext';
import type { SQLBuildResult, SQLParams } from '../utils/types';
import { Database } from 'bun:sqlite';

export class InsertStatement extends QueryExecuter {
  private table: string;
  private sqlValues: SQLParams = {};

  constructor(table: string, db: Database) {
    super(db);
    this.table = quoteTable(table);
  }

  values(sqlValues: SQLParams) {
    this.sqlValues = sqlValues;

    return this;
  }

  protected build(): SQLBuildResult {
    const params = new ParameterContext();

    const columns = [];
    const values = [];

    for (const [column, value] of Object.entries(this.sqlValues)) {
      params.addParameter(value);

      columns.push(quoteColumn(column));
      values.push(value);
    }

    return {
      sql: `INSERT INTO ${this.table} (${columns.join(
        ', '
      )}) VALUES (${Object.keys(params.getParameters()).join(', ')})`,
      params: params.getParameters(),
    };
  }
}
