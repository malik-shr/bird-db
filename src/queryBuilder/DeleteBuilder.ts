import type {
  SQLBuildResult,
  SQLOperator,
  SQLParams,
  SQLValue,
} from '../utils/types';
import { WhereClause } from './WhereClause';
import { Database } from 'bun:sqlite';
import { QueryExecuter } from '../queryExecutor/QueryExecutor';

export class DeleteBuilder extends QueryExecuter {
  private fromTable: string = '';
  private whereConditions: WhereClause | null = null;

  constructor(fromTable: string, db: Database) {
    super(db);
    this.fromTable = fromTable;
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
    if (this.fromTable.length === 0) {
      throw new Error('FROM table is required');
    }

    let sql = `DELETE FROM ${this.fromTable}`;
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

  sql() {
    return this.buildQuery().sql;
  }
}
