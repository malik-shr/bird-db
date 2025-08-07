import { QueryExecuter } from '../queryExecutor/QueryExecutor';
import type { SQLBuildResult } from '../utils/types';
import { Database } from 'bun:sqlite';
import { quoteColumn, quoteTable } from '../utils/utils';

export type CreateColumn = {
  [key: string]: string;
};

export class CreateTableStatement extends QueryExecuter {
  private columns: CreateColumn;
  private table: string;
  private createStatement: string;

  constructor(table: string, columns: CreateColumn, db: Database) {
    super(db);
    this.columns = columns;
    this.table = table;
    this.createStatement = 'CREATE TABLE';
  }

  checkFirst() {
    this.createStatement = 'CREATE TABLE IF NOT EXISTS';

    return this;
  }

  protected build(): SQLBuildResult {
    const createColumns = Object.keys(this.columns).map((key) => {
      return `${quoteColumn(key)} ${this.columns[key]}`;
    });

    const sql = `${this.createStatement} ${quoteTable(
      this.table
    )} (${createColumns.join(', ')})`;

    return { sql, params: {} };
  }
}
