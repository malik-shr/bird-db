import { QueryBuilder } from './queryBuilder/QueryBuilder';
import { or, and, ref, whereRef, c } from './queryBuilder/WhereHelpers';
import {
  COUNT,
  SUM,
  MIN,
  MAX,
  AVG,
  UPPER,
  LOWER,
  LENGTH,
} from './utils/sqlFunctions';

export { QueryBuilder };
export { or, and, ref, whereRef, c };
export { COUNT, SUM, MIN, MAX, AVG, UPPER, LOWER, LENGTH };

import { Database } from 'bun:sqlite';

const db = new Database(':memory:');
const qb = new QueryBuilder(db);

const s = qb.select().from('users').where(['id', '=', 2]).sql();
console.log(s);
