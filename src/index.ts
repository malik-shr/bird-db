import { QueryBuilder } from './queryBuilder/QueryBuilder';

export { QueryBuilder };

import { Database } from 'bun:sqlite';

const db = new Database(':memory:');
const qb = new QueryBuilder(db);

const c = qb
  .select('users.id')
  .from('users')
  .where((w) =>
    w.or((or) =>
      or
        .and((youngUsers) => youngUsers.condition('age', '<', 18))
        .and((olderUsers) => olderUsers.condition('age', '>', 65))
    )
  );

console.log(c.sql());
