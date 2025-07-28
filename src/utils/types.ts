export type SQLOperator =
  | '='
  | '!='
  | '<>'
  | '>'
  | '<'
  | '>='
  | '<='
  | 'LIKE'
  | 'ILIKE'
  | 'IN'
  | 'NOT IN'
  | 'BETWEEN'
  | 'NOT BETWEEN'
  | 'EXISTS'
  | 'NOT EXISTS';

export type SQLValue = string | number | boolean | null;

export interface SQLValues {
  [key: string]: SQLValue;
}

export interface SQLParams {
  [key: string]: SQLValue;
}

export type SQLBuildResult = {
  sql: string;
  params: SQLParams;
};
