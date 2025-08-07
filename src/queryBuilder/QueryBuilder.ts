import { Database } from 'bun:sqlite';
import { SelectStatement, type SelectField } from './SelectStatement';
import { InsertStatement } from './InsertStatement';
import { DeleteStatement } from './DeleteStatement';
import { UpdateStatement } from './UpdateStatement';
import type { SQLParams } from '../utils/types';
import { RawStatement } from './RawStatement';
import {
  CreateTableStatement,
  type CreateColumn,
} from './CreateTableStatement';
import { DropTableStatement } from './DropTableStatement';

export class QueryBuilder {
  /** Instance of bun:sqlite database */
  public db: Database;

  constructor(path: string) {
    this.db = new Database(path);
  }

  select(...columns: SelectField[]) {
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

  createTable(table: string, columns: CreateColumn) {
    return new CreateTableStatement(table, columns, this.db);
  }

  dropTable(table: string) {
    return new DropTableStatement(table, this.db);
  }

  transaction(insideTransaction: (...args: any) => void) {
    return this.db.transaction(insideTransaction);
  }
}
