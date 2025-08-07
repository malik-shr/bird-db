import { QueryExecuter } from '../queryExecutor/QueryExecutor';
import type { SQLBuildResult, SQLParams } from '../utils/types';
import { Database } from 'bun:sqlite';
import { quoteTable } from '../utils/utils';

export class DropTableStatement extends QueryExecuter {
  private table: string;

  constructor(table: string, db: Database) {
    super(db);
    this.table = table;
  }

  protected build(): SQLBuildResult {
    const sql = `DROP TABLE ${quoteTable(this.table)}`;

    return { sql, params: {} };
  }
}
