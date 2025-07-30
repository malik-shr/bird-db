import { QueryExecuter } from '../queryExecutor/QueryExecutor';
import type { SQLBuildResult, SQLParams } from '../utils/types';
import { Database } from 'bun:sqlite';

export class RawStatement extends QueryExecuter {
  private statement: string;
  private parameters: SQLParams;

  constructor(statement: string, params: SQLParams, db: Database) {
    super(db);
    this.statement = statement;
    this.parameters = params;
  }

  protected build(): SQLBuildResult {
    return { sql: this.statement, params: this.parameters };
  }
}
