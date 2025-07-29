import { QueryBuilder } from './queryBuilder/QueryBuilder';

export { QueryBuilder };

import { Database } from 'bun:sqlite';

const db = new Database(':memory:');
const qb = new QueryBuilder(db);

const query = qb
  .select('users.id')
  .from('users')
  .where(['id', '=', 'afafa'], ['age', '>', 5])
  .join('wages', 'wages.id', 'users.id')
  .orderBy('columns', 'ASC')
  .orderBy('cl', 'DESC');

console.log(query.sql());
