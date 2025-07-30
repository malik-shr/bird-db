import { Database } from 'bun:sqlite';
import type { SQLBuildResult, SQLParams } from '../utils/types';

// Helper type to track if a class has been set
type HasClass<T> = { __hasClass: true; __type: T };
type NoClass = { __hasClass: false; __type: any };

export abstract class QueryExecuter<
  TState extends HasClass<any> | NoClass = NoClass
> {
  constructor(private db: Database) {}

  protected abstract build(): SQLBuildResult;

  private asClass?: new (...args: any[]) => any;

  // Type-safe as() method that returns a new typed instance
  as<U>(asClass: new (...args: any[]) => U): QueryExecuter<HasClass<U>> {
    // Create a new instance with the same prototype and properties
    const newInstance = Object.create(
      Object.getPrototypeOf(this)
    ) as QueryExecuter<HasClass<U>>;

    // Copy all properties from the current instance
    Object.assign(newInstance, this);

    // Set the asClass property
    (newInstance as any).asClass = asClass;

    return newInstance;
  }

  // Method overloads for get()
  get(): TState extends HasClass<infer T> ? T : any;
  get() {
    const { sql, params } = this.build();

    if (!this.asClass) {
      return this.db.query(sql).get(params);
    }

    return this.db.query(sql).as(this.asClass).get(params);
  }

  // Method overloads for all()
  all(): TState extends HasClass<infer T> ? T[] : any[];
  all() {
    const { sql, params } = this.build();

    if (!this.asClass) {
      return this.db.query(sql).all(params);
    }

    return this.db.query(sql).as(this.asClass).all(params);
  }

  // run() doesn't need type safety as it returns execution results
  run() {
    const { sql, params } = this.build();

    if (!this.asClass) {
      return this.db.query(sql).run(params);
    }

    return this.db.query(sql).as(this.asClass).run(params);
  }

  sql(): string {
    const { sql } = this.build();
    return sql;
  }

  params(): SQLParams {
    const { params } = this.build();
    return params;
  }
}
