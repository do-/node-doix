![workflow](https://github.com/do-/node-doix/actions/workflows/main.yml/badge.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)

`doix` is a node.js based framework for building middleware applications. The core module is totally dependency free, so it contains only general purpose, mostly abstract classes. Their bindings to specific protocols and external libraries are implemented in multiple sibling projects:

* [doix-http](https://github.com/do-/node-doix-http) — for building Web applications
  * [doix-http-cookie-redis](https://github.com/do-/node-doix-http-cookie-redis) — HTTP cookie based sessions using [Redis](https://redis.io/) cache
  * [doix-w2ui](https://github.com/do-/node-doix-w2ui) — [w2ui](https://w2ui.com/) AJAX request parser 
* [doix-db](https://github.com/do-/node-doix-db) — the common part for database drivers
  * [doix-db-postgresql](https://github.com/do-/node-doix-db-postgresql) — [PostgreSQL DBMS](https://www.postgresql.org/) adapter
  * [doix-db-clickhouse](https://github.com/do-/node-doix-db-clickhouse) — [ClickHouse DBMS](https://clickhouse.com/) adapter
* [node-doix-legacy](https://github.com/do-/node-doix-legacy) — a compatibility layer for some existing projects

More information is available in [wiki](https://github.com/do-/node-doix/wiki) documentation.
