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

  insertInto(table: string) {
    return new InsertBuilder(table, this.db);
  }

  deleteFrom(fromTable: string) {
    return new DeleteBuilder(fromTable, this.db);
  }

  updateTable(table: string) {
    return new UpdateBuilder(table, this.db);
  }
}
