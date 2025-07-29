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

export interface SQLParams {
  [key: string]: SQLValue;
}

export type SQLBuildResult = {
  sql: string;
  params: SQLParams;
};

type JoinOperator =
  | 'JOIN'
  | 'INNER JOIN'
  | 'LEFT JOIN'
  | 'RIGHT JOIN'
  | 'FULL JOIN';

export type JoinCondition = {
  table: string;
  c1: string;
  c2: string;
  operator: JoinOperator;
};

export type OrderDirection = 'ASC' | 'DESC';
export type OrderCondition = {
  column: string;
  direction: OrderDirection;
};

export type ComparisonOperator = '=' | '!=' | '<>' | '>' | '<' | '>=' | '<=';
export type ListOperator = 'IN' | 'NOT IN';
export type LikeOperator = 'LIKE' | 'NOT LIKE';
export type NullOperator = 'IS NULL' | 'IS NOT NULL';
export type SqlOperator =
  | ComparisonOperator
  | ListOperator
  | LikeOperator
  | NullOperator;
