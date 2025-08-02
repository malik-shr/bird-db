import type { SelectStatement } from '../queryBuilder/SelectStatement';
import type { WhereClause } from '../queryBuilder/WhereClause';
import { quoteColumn } from './utils';

export interface FunctionType<T> {
  type: 'function';
  sql: string;
  as(alias: string): FunctionType<T>;
}

function sqlFunction<T>(column: string, sqlFunction: string): FunctionType<T> {
  const baseSql = `${sqlFunction}(${quoteColumn(column)})`;

  return {
    type: 'function',
    sql: baseSql,
    as(alias: string) {
      return {
        type: 'function',
        sql: `${baseSql} AS "${alias}"`,
        as: this.as,
      };
    },
  };
}

export function COUNT(column: string): FunctionType<SelectStatement> {
  return sqlFunction<SelectStatement>(column, 'COUNT');
}

export function SUM(column: string): FunctionType<SelectStatement> {
  return sqlFunction<SelectStatement>(column, 'SUM');
}

export function MIN(column: string): FunctionType<SelectStatement> {
  return sqlFunction<SelectStatement>(column, 'MIN');
}

export function MAX(column: string): FunctionType<SelectStatement> {
  return sqlFunction<SelectStatement>(column, 'MAX');
}

export function AVG(column: string): FunctionType<SelectStatement> {
  return sqlFunction<SelectStatement>(column, 'AVG');
}

export function UPPER(column: string): FunctionType<SelectStatement> {
  return sqlFunction<SelectStatement | WhereClause>(column, 'UPPER');
}
export function LOWER(column: string): FunctionType<SelectStatement> {
  return sqlFunction<SelectStatement | WhereClause>(column, 'LOWER');
}
export function LENGTH(column: string): FunctionType<SelectStatement> {
  return sqlFunction<SelectStatement | WhereClause>(column, 'LENGTH');
}
