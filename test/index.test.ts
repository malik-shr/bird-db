import { describe, it, expect } from 'bun:test';
import { QueryBuilder } from '../src';
import { Database } from 'bun:sqlite';

describe('should', () => {
  const db = new Database(':memory:');
  const bb = new QueryBuilder(db);

  it('Select', () => {
    const statement = bb
      .select()
      .from('data')
      .where('name', '=', 'Deven')
      .toString();
    const expected = 'SELECT * FROM data WHERE name = $0';

    expect(statement).toBe(expected);
  });

  it('Insert and Select', () => {
    const query = db.query(
      'CREATE TABLE users(id TEXT PRIMARY KEY NOT NULL, username TEXT UNIQUE NOT NULL, email TEXT NOT NULL)'
    );
    query.run();

    const stmt1 = bb
      .insertInto('users')
      .values({ id: '1', username: 'bird', email: 'bird@gmail.com' });
    stmt1.run();

    const stmt2 = bb.select(['id', 'username', 'email']).from('users');
    const result = stmt2.get();

    expect(
      Bun.deepEquals(
        result,
        { id: '1', username: 'bird', email: 'bird@gmail.com' },
        true
      )
    );
  });
  it('Delete', () => {
    const deleteStmt = bb.deleteFrom('users').where('id', '=', '1');
    deleteStmt.run();

    const getStmt = bb.select().from('users').all();

    expect(getStmt.length).toBe(0);
  });
});
