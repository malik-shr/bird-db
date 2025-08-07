import { describe, it, expect } from 'bun:test';
import { COUNT, QueryBuilder } from '../src';

describe('Table', () => {
  const bb = new QueryBuilder(':memory:');

  class ExampleCount {
    count!: number;
  }

  it('Create Table', () => {
    const createStatement = bb.createTable('example', {
      id: 'VARCHAR(255) NOT NULL PRIMARY KEY UNIQUE',
      first_name: 'VARCHAR(50) NOT NULL',
      last_name: 'VARCHAR(50)',
    });

    createStatement.run();

    bb.insertInto('example')
      .values({ id: '1', first_name: 'bird', last_name: 'db' })
      .run();

    const selectStatement = bb
      .select(COUNT('*').as('count'))
      .from('example')
      .castTo(ExampleCount)
      .get();

    expect(selectStatement.count).toBe(1);
  });

  it('transactions', () => {
    const transaction = bb.transaction(() => {
      bb.insertInto('example')
        .values({ id: '2', first_name: 'bird', last_name: 'db' })
        .run();
      bb.insertInto('example')
        .values({ id: '3', first_name: 'bird', last_name: 'db' })
        .run();
    });

    transaction();

    const selectQuery = bb
      .select(COUNT('*').as('count'))
      .from('example')
      .castTo(ExampleCount)
      .get();

    expect(selectQuery.count).toBe(3);
  });

  it('Drop Table', () => {
    bb.dropTable('example').run();

    const selectFunction = () => {
      return bb
        .select(COUNT('*').as('count'))
        .from('example')
        .castTo(ExampleCount)
        .get();
    };

    expect(selectFunction).toThrow(/no such table: example/);
  });
});
