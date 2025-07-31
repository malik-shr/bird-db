import { quoteColumn } from './utils';

interface FunctionType<T> {
  type: 'function';
  sql: string;
  as(alias: string): FunctionType<T>;
}

export type SelectField = string | FunctionType<SelectField>;

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

export function COUNT(column: string): FunctionType<SelectField> {
  return sqlFunction<SelectField>(column, 'COUNT');
}

export function SUM(column: string): FunctionType<SelectField> {
  return sqlFunction<SelectField>(column, 'SUM');
}

export function MIN(column: string): FunctionType<SelectField> {
  return sqlFunction<SelectField>(column, 'MIN');
}

export function MAX(column: string): FunctionType<SelectField> {
  return sqlFunction<SelectField>(column, 'MAX');
}

export function AVG(column: string): FunctionType<SelectField> {
  return sqlFunction<SelectField>(column, 'AVG');
}

export function UPPER(column: string): FunctionType<SelectField> {
  return sqlFunction<SelectField>(column, 'UPPER');
}
export function LOWER(column: string): FunctionType<SelectField> {
  return sqlFunction<SelectField>(column, 'LOWER');
}
export function LENGTH(column: string): FunctionType<SelectField> {
  return sqlFunction<SelectField>(column, 'LENGTH');
}
