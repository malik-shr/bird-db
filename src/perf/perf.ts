import { Database } from 'bun:sqlite';
import { QueryBuilder } from '..';

function builderPerf() {
  const start = performance.now();
  const builder = new QueryBuilder(new Database(':memory:')); // or pass a mock

  for (let i = 0; i < 1_000_000; i++) {
    const query = builder
      .select(['id', 'username'])
      .from('users')
      .where('id', '=', i.toString());

    const sql = query.sql(); // no actual DB involved
  }

  const end = performance.now();
  console.log('Builder only: ' + Math.round(end - start) + 'ms');
}

function insertPerf() {
  const start = performance.now();
  const db = new Database(':memory:');
  const builder = new QueryBuilder(db);

  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL
    )
  `);

  const insertMany = db.transaction((entries: any[]) => {
    for (const user of entries) {
      builder.insertInto('users').values(user).run();
    }
  });

  const users = Array.from({ length: 100_000 }, (_, i) => ({
    id: i.toString(),
    username: `user-${i}`,
    email: `email@web${i}.de`,
  }));

  insertMany(users);

  const end = performance.now();
  console.log('Insert time: ' + Math.round(end - start) + 'ms');
}

builderPerf();
insertPerf();
