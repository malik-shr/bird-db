
---

````markdown
# bird-db

A simple and lightweight query builder for [Bun](https://bun.sh/) using native SQLite bindings.  
PostgreSQL support is planned.

Currently it only supports SQLite
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
bun add github:malik-shr/bird-db
```

## Setup

```ts
import { Database } from 'bun:sqlite';
import { QueryBuilder } from 'bird-db';

const db = new Database(':memory:');
const qb = new QueryBuilder(db);
```

## Supported Syntax
### Select

```ts

import {
  COUNT,
  SUM,
  AVG,
  MIN,
  MAX,
  AVG,
  UPPER,
  LOWER,
  LENGTH,
  ref,
  WhereRef,
  raw,
  and,
  or
} from 'bird-db';

// Simple Select
// * by default if kept empty
bb.select("id", "username").from("users")

// Select subquery
const name = "Albert"
const subquery =  bb
                    .select(MAX("id").as("owner_id"))
                    .from("store_owners AS s") // Support for alias
                    .where(["s.name", "=", name])
bb.select(subquery.as("store_owner")).from("users")

// SQL Functions COUNT, SUM, AVG, MIN, MAX, AVG, UPPER, LOWER, LENGTH
bb
    .select(
        SUM("age").as("age")
    )
    .from("users")

// Support for join leftJoin, rightJoin, fullJoin etc.
bb.select().from("users").join("store owners", "users.id", "store_owners.id").orderBy("users.id", "ASC")
```

## WHERE
```ts
// Compare column with value (also users.age is supported)
bb.select().from("users").where(["age", ">", 18])

// Null Operators "NOT NULL/ IS NULL"
bb.select().from("users").where(["username", "NOT NULL"])

// Like comparison
bb.select().from("users").where(["username", "LIKE", "a%"])

// Where In
bb.select().from("users").where(["age", "IN", [10, 15, 18]])

// Reference to other column
bb.select().from("users AS u", "store_owner AS s").where(["u.id", "=", ref("s.id")])
// Alternative
bb.select().from("users AS u", "store_owner AS s").where(whereRef("u.id", "=", "s.id"))

// Where with subquery
    bb
        .select()
        .from("users")
        .where(
            [bb.select("name").from("users"), "=", "Albert"]
        )

// Where Raw
    bb
        .select()
        .from("users AS u", "store_owners AS s")
        .where(raw("UPPER(u.name) = UPPER(s.name)"))

// Complex statements AND
    bb
        .select()
        .from("users u")
        .where(["u.name", "=", "Albert"], ["u.age", ">=", 18])
// Alternative 1
    bb
        .select()
        .from("users u")
        .where(
            and(["u.name", "=", "Albert"], ["u.age", ">=", 18])
        )
// Alternative 2
    bb
        .select()
        .from("users u")
        .where(["u.name", "=", "Albert"])
        .where(["u.age", ">=", 18])

// Or
    bb
        .select()
        .from("users u")
        .where(
            or(["u.name", "=", "Heinz"], ["u.name", "=", "Kunz"])
        )
// Nested Where condition
    bb
        .select()
        .from("users u")
        .where(
            and(
                and(["u.name", "=", "Heinz"], ["age", ">=", 18])
                and(["u.name", "=", "Kunz"], ["age", ">=", 16])
            )
        )
```

## Insert
```ts    
const stmt1 = bb
      .insertInto('users')
      .values({ id: '1', username: 'bird', email: 'bird@email.com' });

stmt1.run();
```

## Delete
```ts
const deleteStmt = bb.deleteFrom('users').where(['id', '=', '1']);
deleteStmt.run();
```

## Update
```ts
const updateStmt = bb
                    .updateTable("users")
                    .set({username: "Heinz"})
                    .where(["id", "=", 5])
updateStmt.run()
```

## Execution
```ts
const adultUsers = select().from("users").where(["age", ">=", 18])

class User {
    id: string;
    username: string;
    email: string;
    age: number
}

// Get 
// Returns first object
adultUsers.get()
// Cast to object
adultUsers.castTo(User).get()

// All
// Returns all objects
adultUsers.all()
// Cast to object
adultUsers.castTo(User).all()

// Run
// Returns nothing and executes the query
adultUsers.run()
```

##

## Roadmap

- [ ] Support for table methods
- [ ] Support for transactions
- [ ] PostgreSQL support
- [ ] SQL Injection safety

---
````
