import { Database } from 'bun:sqlite';
import type { SQLParams } from '../utils/types';

export class QueryExecuter {
  sql: string;
  params: SQLParams;
  db: Database;

  constructor(sql: string, params: SQLParams = {}, db: Database) {
    this.sql = sql;
    this.params = params;
    this.db = db;
  }

  get() {
    const query = this.db.query(this.sql);
    return query.get(this.params);
  }

  all() {
    const query = this.db.query(this.sql);
    return query.all(this.params);
  }

  run() {
    const query = this.db.query(this.sql);
    return query.run(this.params);
  }
}
