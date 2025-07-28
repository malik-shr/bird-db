import type {
  SQLBuildResult,
  SQLOperator,
  SQLParams,
  SQLValue,
  SQLValues,
} from '../utils/types';
import { WhereClause } from '../helpers/WhereClause';
import { Database } from 'bun:sqlite';

export class UpdateBuilder {
  private table: string = '';
  private whereConditions: WhereClause | null = null;
  private sqlValues: SQLValues = {};

  private asClass: any;
  private db: Database;

  constructor(table: string, db: Database) {
    this.table = table;
    this.db = db;
  }

  set(sqlValues: SQLValues) {
    this.sqlValues = sqlValues;
  }

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

  toSQL(startingIndex = 0): SQLBuildResult {
    if (this.table.length === 0) {
      throw new Error('FROM table is required');
    }

    let params: SQLParams = {};

    let paramIndex = startingIndex;

    const setValues: string[] = [];

    for (const [column, value] of Object.entries(this.sqlValues)) {
      const paramIndexStr = `$${paramIndex}`;

      setValues.push(`${column} = ${paramIndexStr}`);
      params[paramIndexStr] = value;
      ++paramIndex;
    }

    let sql = `UPDATE ${this.table} SET ${setValues.join(',')}`;

    if (this.whereConditions) {
      const whereResult = this.whereConditions.toSQL(paramIndex);
      if (whereResult.sql.trim()) {
        sql += ` WHERE ${whereResult.sql}`;
        params = { ...params, ...whereResult.params };
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
