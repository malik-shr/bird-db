import { Database } from 'bun:sqlite';
import type { SQLBuildResult } from '../utils/types';

export abstract class QueryExecuter<T = unknown> {
  constructor(private db: Database) {}

  protected abstract build(): SQLBuildResult;

  private asClass?: new (...args: any[]) => T;

  as(asClass: new (...args: any[]) => T): this {
    this.asClass = asClass;
    return this;
  }

  get() {
    const { sql, params } = this.build();
    let query = this.db.query(sql);

    if (this.asClass) {
      query = this.db.query(sql).as(this.asClass);
    }

    return query.get(params);
  }

  all() {
    const { sql, params } = this.build();
    let query = this.db.query(sql);

    if (this.asClass) {
      query = this.db.query(sql).as(this.asClass);
    }

    return query.all(params);
  }

  run() {
    const { sql, params } = this.build();
    let query = this.db.query(sql);

    if (this.asClass) {
      query = this.db.query(sql).as(this.asClass);
    }

    return query.run(params);
  }

  sql() {
    const { sql } = this.build();

    return sql;
  }

  params() {
    const { params } = this.build();

    return params;
  }
}
