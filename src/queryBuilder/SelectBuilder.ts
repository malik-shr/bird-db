import type {
  SQLBuildResult,
  SQLOperator,
  SQLParams,
  SQLValue,
} from '../utils/types';
import { WhereClause } from '../helpers/WhereClause';
import { Database } from 'bun:sqlite';

export class SelectQueryBuilder {
  private selectFields: string[] = [];
  private fromTable: string[] = [];
  private whereConditions: WhereClause | null = null;

  private asClass: any;
  private db: Database;

  constructor(selectFields: string[], db: Database) {
    this.selectFields = selectFields;
    this.db = db;
  }

  reset(): this {
    this.selectFields = [];
    this.fromTable = [];
    this.whereConditions = null;
    return this;
  }

  select(fields: string | string[]): this {
    this.selectFields = Array.isArray(fields) ? fields : [fields];
    return this;
  }

  from(tables: string | string[]): this {
    this.fromTable = Array.isArray(tables) ? tables : [tables];
    return this;
  }

  // Main where method - accepts a WhereClause or callback function
  where(condition: WhereClause): this;
  where(field: string, operator: SQLOperator, value: SQLValue): this;
  where(callback: (whereClause: WhereClause) => void): this;
  where(
    conditionOrField:
      | WhereClause
      | string
      | ((whereClause: WhereClause) => void),
    operator?: SQLOperator,
    value?: SQLValue
  ): this {
    if (typeof conditionOrField === 'function') {
      const whereClause = new WhereClause();
      conditionOrField(whereClause);
      this.whereConditions = whereClause;
    } else if (conditionOrField instanceof WhereClause) {
      this.whereConditions = conditionOrField;
    } else if (typeof conditionOrField === 'string' && operator !== undefined) {
      // Simple condition: where('name', '=', 'John')
      const whereClause = new WhereClause();
      whereClause.condition(conditionOrField, operator, value!);
      this.whereConditions = whereClause;
    }
    return this;
  }

  toSQL(): SQLBuildResult {
    if (this.selectFields.length === 0) {
      throw new Error('SELECT fields are required');
    }

    if (this.fromTable.length === 0) {
      throw new Error('FROM table is required');
    }

    let sql = `SELECT ${this.selectFields.join(
      ', '
    )} FROM ${this.fromTable.join(', ')}`;
    let params: SQLParams = {};

    if (this.whereConditions) {
      const whereResult = this.whereConditions.toSQL();
      if (whereResult.sql.trim()) {
        sql += ` WHERE ${whereResult.sql}`;
        params = whereResult.params;
      }
    }

    return { sql, params };
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
