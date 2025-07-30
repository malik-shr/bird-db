
---

````markdown
# bird-sql

A simple and lightweight query builder for [Bun](https://bun.sh/) using native SQLite bindings.  
PostgreSQL support is planned.

> ⚠️ **Warning**: This library is **experimental** and **not recommended for production use**.

---

## Features

- Chainable query builder syntax
- Supports `SELECT`, `INSERT`, `UPDATE`, and `DELETE`
- Automatic value binding (e.g., `$0`, `$1`, etc.)
- Built-in methods for executing queries: `.get()`, `.all()`, `.run()`

````

> _Not yet published to npm. You can install via a local path or GitHub until then._

## Installation

```bash
bun add github:malik-shr/bird-sql
```

## Setup

```ts
import { Database } from 'bun:sqlite';
import { QueryBuilder } from 'bird-sql';

const db = new Database(':memory:');
const qb = new QueryBuilder(db);
```

---

## SELECT

### TypeScript

```ts
qb.select('users.id', 'users.username', 'users.email')
  .from('users')
  .where(['users.id', '=', 'ew31tsdgsda']);
```

### SQL

```sql
SELECT
  users.id,
  users.username,
  users.email
FROM
  users
WHERE
  users.id = $0
```

---

## INSERT

### TypeScript

```ts
qb.insertInto('users').values({
  id: 'afsdtfs-wetwas-fadf',
  username: 'bird',
  email: 'bird@gmail.com',
});
```

### SQL

```sql
INSERT INTO users (id, username, email)
VALUES ($0, $1, $2)
```

---

## UPDATE

### TypeScript

```ts
qb.updateTable('users')
  .set({ email: 'web@mail.de' })
  .where(['users.id', '=', 'afsdtfs-wetwas-fadf']);
```

### SQL

```sql
UPDATE users
SET email = $0
WHERE users.id = $1
```

---

## DELETE

### TypeScript

```ts
qb.deleteFrom('users').where(['id', '=', 'afsdtfs-wetwas-fadf']);
```

### SQL

```sql
DELETE FROM users
WHERE id = $0
```

---

## Execution

```ts
const query = qb
  .select(['users.id', 'users.username', 'users.email'])
  .from('users')
  .where('users.id', '=', 'ew31tsdgsda');

const resultOne = query.get(); // Returns the first matching row as an object
const resultAll = query.all(); // Returns all matching rows as an array
query.run(); // Executes the query without returning results (for INSERT/UPDATE/DELETE)
```

---

## Roadmap

- [ ] PostgreSQL support
- [ ] Query result type inference
- [ ] SQL Injection safety

---
````
