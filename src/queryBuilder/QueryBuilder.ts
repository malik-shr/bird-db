import { Database } from 'bun:sqlite';
import { SelectQueryBuilder } from './SelectBuilder';
import { InsertBuilder } from './InsertBuilder';
import { DeleteBuilder } from './DeleteBuilder';
import { UpdateBuilder } from './UpdateBuilder';

export class QueryBuilder {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  select(columns: string | string[] = '*') {
    let selectCols: string[] = [];

    if (typeof columns === 'string') {
      selectCols = columns === '*' ? ['*'] : [columns];
    } else {
      selectCols = columns;
    }

    return new SelectQueryBuilder(selectCols, this.db);
  }

  insertInto(tables: string[]) {
    const intoTables = Array.isArray(tables) ? tables : [tables];
    return new InsertBuilder(intoTables, this.db);
  }

  deleteFrom(tables: string[]) {
    const fromTable = Array.isArray(tables) ? tables : [tables];
    return new DeleteBuilder(fromTable, this.db);
  }

  updateTable(tables: string[]) {
    const updateTables = Array.isArray(tables) ? tables : [tables];
    return new UpdateBuilder(updateTables, this.db);
  }
}
