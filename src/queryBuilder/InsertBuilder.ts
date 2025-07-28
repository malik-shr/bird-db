import type { SQLBuildResult, SQLParams, SQLValues } from '../utils/types';
import { Database } from 'bun:sqlite';

export class InsertBuilder {
  private table: string;
  private sqlValues: SQLValues = {};

  private asClass: any;
  private db: Database;

  constructor(table: string, db: Database) {
    this.table = table;
    this.db = db;
  }

  values(sqlValues: SQLValues) {
    this.sqlValues = sqlValues;

    return this;
  }

  toSQL(startingIndex = 0): SQLBuildResult {
    let paramIndex = startingIndex;
    const params: SQLParams = {};

    const columns = [];
    const values = [];

    for (const [column, value] of Object.entries(this.sqlValues)) {
      const paramIndexStr = `$${paramIndex}`;

      columns.push(column);
      values.push(value);

      params[paramIndexStr] = value;

      ++paramIndex;
    }

    return {
      sql: `INSERT INTO ${this.table} (${columns.join(
        ','
      )}) VALUES (${Object.keys(params).join(',')})`,
      params: params,
    };
  }

  toString() {
    return this.toSQL().sql;
  }

  as(asClass: any) {
    this.asClass = asClass;
    return this;
  }

  get() {
    const { params, sql } = this.toSQL();

    let query;

    if (this.asClass) {
      query = this.db.query(sql).as(this.asClass);
    } else {
      query = this.db.query(sql);
    }

    const result = query.get(params);

    return result;
  }

  all() {
    const { params, sql } = this.toSQL();

    let query;

    if (this.asClass) {
      query = this.db.query(sql).as(this.asClass);
    } else {
      query = this.db.query(sql);
    }

    return query.all(params);
  }

  run() {
    const { params, sql } = this.toSQL();

    let query;

    if (this.asClass) {
      query = this.db.query(sql);
    } else {
      query = this.db.query(sql);
    }

    return query.run(params);
  }
}
