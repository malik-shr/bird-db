import type {
  SQLBuildResult,
  SQLOperator,
  SQLParams,
  SQLValue,
  SQLValues,
} from '../utils/types';
import { WhereClause } from './WhereClause';
import { Database } from 'bun:sqlite';
import { QueryExecuter } from '../queryExecutor/QueryExecutor';

export class UpdateBuilder extends QueryExecuter {
  private table: string = '';
  private whereConditions: WhereClause | null = null;
  private sqlValues: SQLValues = {};

  constructor(table: string, db: Database) {
    super(db);
    this.table = table;
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

  protected buildQuery(): SQLBuildResult {
    if (this.table.length === 0) {
      throw new Error('FROM table is required');
    }

    let params: SQLParams = {};

    let paramIndex = 0;

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

  sql() {
    return this.buildQuery().sql;
  }
}
