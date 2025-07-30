import { Database } from 'bun:sqlite';
import { SelectStatement } from './SelectStatement';
import { InsertStatement } from './InsertStatement';
import { DeleteStatement } from './DeleteStatement';
import { UpdateStatement } from './UpdateStatement';
import type { SQLParams } from '../utils/types';
import { RawStatement } from './RawStatement';

export class QueryBuilder {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  select(...columns: string[]) {
    const selectCols = columns.length === 0 ? ['*'] : columns;
    return new SelectStatement(selectCols, this.db);
  }

  insertInto(table: string) {
    return new InsertStatement(table, this.db);
  }

  deleteFrom(table: string) {
    return new DeleteStatement(table, this.db);
  }

  updateTable(table: string) {
    return new UpdateStatement(table, this.db);
  }

  raw(statement: string, params: SQLParams = {}) {
    return new RawStatement(statement, params, this.db);
  }
}
