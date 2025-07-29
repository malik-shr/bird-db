import { Database } from 'bun:sqlite';
import type { SQLBuildResult } from '../utils/types';

export abstract class QueryExecuter<T = unknown> {
  constructor(private db: Database) {}

  protected abstract buildQuery(): SQLBuildResult;

  private asClass?: new (...args: any[]) => T;

  as(asClass: new (...args: any[]) => T): this {
    this.asClass = asClass;
    return this;
  }

  get(): T | undefined {
    const { sql, params } = this.buildQuery();
    const result = this.db.query(sql).get(params);
    return this.map(result);
  }

  all(): T[] {
    const { sql, params } = this.buildQuery();
    const results = this.db.query(sql).all(params);
    return results.map((r) => this.map(r));
  }

  run() {
    const { sql, params } = this.buildQuery();
    return this.db.query(sql).run(params);
  }

  private map(row: any): T {
    return this.asClass ? new this.asClass(row) : row;
  }
}
