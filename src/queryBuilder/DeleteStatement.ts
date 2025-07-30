import type { SQLBuildResult, SQLParams } from '../utils/types';
import { Database } from 'bun:sqlite';
import { QueryExecuter } from '../queryExecutor/QueryExecutor';
import { WhereClause, type InputCondition } from '../helpers/WhereClause';
import { ParameterContext } from '../utils/ParamContext';
import { quoteTable } from '../helpers/utils';

export class DeleteStatement extends QueryExecuter {
  private fromTable: string;
  private whereClauses: WhereClause[] = [];
  private paramContext: ParameterContext;

  constructor(fromTable: string, db: Database) {
    super(db);
    this.fromTable = quoteTable(fromTable);
    this.paramContext = new ParameterContext();
  }

  where(...conditions: readonly InputCondition[]) {
    const whereClause = new WhereClause(conditions, this.paramContext);
    this.whereClauses.push(whereClause);

    return this;
  }

  protected build(): SQLBuildResult {
    if (this.fromTable.length === 0) {
      throw new Error('FROM table is required');
    }

    let sql = `DELETE FROM ${this.fromTable}`;
    let params: SQLParams = {};

    if (this.whereClauses.length > 0) {
      const whereClauses = this.whereClauses.map((whereClause) => {
        const build = whereClause.build();
        return build.sql;
      });

      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    return { sql, params };
  }
}
