import { describe, it, expect } from 'bun:test';
import { QueryBuilder, ref } from '../src';
import { Database } from 'bun:sqlite';
import { quoteColumn } from '../src/helpers/utils';
import { MAX } from '../src/helpers/sqlFunctions';

describe('should', () => {
  const db = new Database(':memory:');
  const bb = new QueryBuilder(db);

  it('Select', () => {
    const statement = bb
      .select(MAX('id').as('YEAH'))
      .from('data')
      .where(['name', '=', ref('data.name')])
      .sql();
    const expected =
      'SELECT MAX("id") AS "YEAH" FROM "data" WHERE ("name" = "data"."name")';

    expect(statement).toBe(expected);
  });
  it('Insert and Select', () => {
    bb.raw(
      'CREATE TABLE users(id TEXT PRIMARY KEY NOT NULL, username TEXT UNIQUE NOT NULL, email TEXT NOT NULL)'
    ).run();

    class User {
      id!: string;
      username!: string;
      email!: string;
    }

    const stmt1 = bb
      .insertInto('users')
      .values({ id: '1', username: 'bird', email: 'bird@email.com' });

    stmt1.run();

    const stmt2 = bb.select('id', 'username', 'email').from('users').as(User);
    const result = stmt2.get();

    expect(result.id).toBe('1');
  });
  it('Delete', () => {
    const deleteStmt = bb.deleteFrom('users').where(['id', '=', '1']);
    deleteStmt.run();

    const getStmt = bb.select().from('users');
    const result = getStmt.all();

    expect(result?.length).toBe(1);
  });
});
