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
  | 'NOT BETWEEN';

export type SQLValue = string | number | bigint | boolean | null;

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
