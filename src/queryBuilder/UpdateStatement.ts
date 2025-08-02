import type { JoinCondition, SQLBuildResult, SQLParams } from '../utils/types';
import { Database } from 'bun:sqlite';
import { QueryExecuter } from '../queryExecutor/QueryExecutor';
import { ParameterContext } from '../utils/ParamContext';
import { WhereClause, type InputCondition } from './WhereClause';
import { quoteColumn, quoteTable } from '../utils/utils';

export class UpdateStatement extends QueryExecuter {
  private table: string;
  private whereClauses: WhereClause[] = [];
  private paramContext: ParameterContext;
  private sqlValues: SQLParams = {};

  constructor(table: string, db: Database) {
    super(db);
    this.table = quoteTable(table);
    this.paramContext = new ParameterContext();
  }

  set(sqlValues: SQLParams) {
    this.sqlValues = sqlValues;

    return this;
  }

  where(...conditions: readonly InputCondition[]) {
    const whereClause = new WhereClause(conditions, this.paramContext);
    this.whereClauses.push(whereClause);

    return this;
  }

  protected build(): SQLBuildResult {
    const params = new ParameterContext();

    const setValues: string[] = [];

    for (const [column, value] of Object.entries(this.sqlValues)) {
      const paramStr = params.addParameter(value);
      setValues.push(`${quoteColumn(column)} = ${paramStr}`);
    }

    let sql = `UPDATE ${this.table} SET ${setValues.join(',')}`;

    if (this.whereClauses.length > 0) {
      const whereClauses = this.whereClauses.map((whereClause) => {
        const build = whereClause.build();
        return build.sql;
      });

      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    return { sql, params: params.getParameters() };
  }
}
