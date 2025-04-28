![workflow](https://github.com/do-/node-doix/actions/workflows/main.yml/badge.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)

`doix` is a middleware framework using [naming conventions](https://github.com/do-/node-doix/wiki/NamingConventions) for routing.

# tl;dr

For a kick start, you may take [doix-http](https://github.com/do-/node-doix-http/wiki), make a tiny Web service and play with it.

Probably, at some point you'll need database connectivity: then use [doix-db](https://github.com/do-/node-doix-db/wiki).

# Description

In essence, `doix` is a general purpose request handler.

Unlike many frameworks, it is not at all Web centric. It's intended for processing all kinds of incoming requests: HTTP* for sure, but also AMQP ones, the likes and, overall, any object considered a "request":
* using [injected](#dependency-injection) resources, including [pooled](https://github.com/do-/node-doix/wiki/ResourcePool) ones, 
* in an [observable](#logging) and [manageable](#bandwidth-management) way, 
* with a fixed simple, clean, but totally [configurable](#extension-points) [lifecycle](#the-workflow).

# The Workflow

Each `request` is handled by a one-off object called [job](https://github.com/do-/node-doix/wiki/Job), specifically, which a single asynchronous call [`await job.outcome ()`](https://github.com/do-/node-doix/wiki/Job#outcome-) which:
* performs initialization (adjusts the request details, sets up default values etc.);
* selects the right business method from the [application](https://github.com/do-/node-doix/wiki/Application)'s [modules](https://github.com/do-/node-require-sliced/wiki/ModuleMap) according to its [naming conventions](https://github.com/do-/node-doix/wiki/NamingConventions);
* executes it in the context of the job available as `this` variable;
* frees the resources used and reports on the completion.

## Why Naming Conventions

In a viable project, you never name a procedure creating a shipping order, say, "f00B4r_BAZZ". It's always "ShippingOrder.create" or "create_shipping_order" or like. Every incoming request invoking such a procedure will probably carry some "create" mark, be it an HTTP verb, SOAP action header, payload fragment etc. And you never want your team mates to name "add" or "make" exactly the same action for the next entity. You need meaningful and consistent rules, just to save time by avoiding the mess.

With such a discipline, the explicit request-to-procedure routing used in several frameworks looks redundant and even a bit error prone. On the other hand, using naming conventions as a part of application logic not only makes your code cleaner, but enforces the adopted rules automatically. Two birds, one stone.

## Extension Points
The core [`Job`](https://github.com/do-/node-doix/wiki/Job) class implementing the simple and straightforward lifecycle is meant to never be extended. But it's completely [event](https://github.com/do-/node-doix/wiki/Job#events) driven, hence, deeply customizable at several levels.

That customization is achieved by developing factory classes extending [`JobSource`](https://github.com/do-/node-doix/wiki/JobSource). Every job comes from some source which sets it up upon creation, including setting event handlers. For instance, the base [`WebService`](https://github.com/do-/node-doix-http/wiki/WebService) (like any protocol adapter in `doix`) is a direct [`JobSource`](https://github.com/do-/node-doix/wiki/JobSource) descendant that tells each newly created job how to fetch request parameters and what to do with the future response / error.

Unlike [`Job`](https://github.com/do-/node-doix/wiki/Job), [`JobSource`](https://github.com/do-/node-doix/wiki/JobSource) is infinitely subclassable to implement not only transport level details, but business logic too. Custom security checks are typical example here. To massively impact the request processing, the [`JobSource`](https://github.com/do-/node-doix/wiki/JobSource) developer has two options:
* to add [event](https://github.com/do-/node-doix/wiki/JobSource#events) handlers (which is flexible, but may cause some problems with the execution order);
* to override [onJob*** methods](https://github.com/do-/node-doix/wiki/JobSource#onjobinit-job) (were the order is guaranteed).

# Dependency injection

`doix` relies heavily on the [DI](https://en.wikipedia.org/wiki/Dependency_injection) concept. Application module's developers operate on [`Job`](https://github.com/do-/node-doix/wiki/Job) instances available as `this`, with multiple properties injected during initialization: `this.app` for the hosting application, `this.request` for the parameters to process, `this.user` for the current actor and so on. The point is to implement business logic having all necessary variables in hand without any extra code.

Pooled resources, such as database connections, are too set preemptively, so you never need to acquire them explicitly. That might cause a performance issue, but injected values are in fact lazy proxy objects, so underlying resources are actually taken from pools only on demand.

And, for sure, what is implicitly acquired, is released the same way. `doix` takes care of the proper cleanup to prevent resource leakage.

# Logging

In node.js, [winston](https://github.com/winstonjs/winston) seems to be the _de facto_ standard logging platform. So `doix` uses it as such. Nearly every core object in `doix` have a corresponding property named `.logger`. For instance, it's one of the injected job's properties, so, in business methods, developers are free to add lines like

```js
this.logger.log ({level, message})
```
Whether it will be actually written and where exactly, depends on the [`JobSource`](https://github.com/do-/node-doix/wiki/JobSource), by default inheriting `.logger` from the hosting [Application](https://github.com/do-/node-doix/wiki/Application).

But it's worth noting that, in most cases, no explicit logging is needed at all. The whole data processing is [tracked automatically](https://github.com/do-/node-events-to-winston): each meaningful event related to a `request` is reported, tagged for later analysis. Related events have related tags, e. g. messages from jobs coming from the same source have IDs with a common prefix and messages from one job's resources have IDs prefixed by this job's ID.

For each `'finish'` event, the time elapsed since the matching `'start'` is calculated and stored into the `winston`'s _info object_. So, with proper configuration, application logs contain hierarchical profiling data.

# Bandwidth management

Although quite minimalistic, `doix` provides some tools for not only calling the right methods for incoming requests, but also for controlling their frequency and execution time.

First of all, every [`JobSource`](https://github.com/do-/node-doix/wiki/JobSource) exposes its set of `.pending` jobs letting count, list them and do whatever else developers need (e. g. forcibly close network connections).

To avoid resource overflows at early stages, the `.pending` size is made easily limitable via the [`maxPending`](https://github.com/do-/node-doix/wiki/JobSource#:~:text=event%2C%20in%20milliseconds-,maxPending,-Number) option.

Another [`JobSource`](https://github.com/do-/node-doix/wiki/JobSource)'s option, [`maxLatency`](https://github.com/do-/node-doix/wiki/JobSource#:~:text=the%20finished%20event-,maxLatency,-Number), is a simple measure against operation hang-ups. Finer tuning at per job level is available by calling [`setMaxLatency ()`](https://github.com/do-/node-doix/wiki/Job#setmaxlatency-ms) prior to executing the business method.

Moreover, the special job source class, [`Queue`](https://github.com/do-/node-doix/wiki/Queue), offers a flow control solution that guarantees the required time lag between sequential operations.

# Modular Design

One of the `doix`'s development goals is to avoid redundant dependencies. In `./node_modules`, your application should have nothing but the necessary minimum.

To this end, the grand project is split into multiple tiny `npm` modules. As of this writing, the family consists of:
* the [Web services boilerplate](https://github.com/do-/node-doix-http/wiki) with cookie based authentication plugins using
  * [JWT](https://github.com/do-/node-doix-http-cookie-jwt/wiki), 
  * [Redis](https://github.com/do-/node-doix-http-cookie-redis/wiki);
* the [relational DB interface](https://github.com/do-/node-doix-db/wiki) with backends for 
  * [PostgreSQL](https://github.com/do-/node-doix-db-postgresql/wiki), 
  * [ClickHouse](https://github.com/do-/node-doix-db-clickhouse/wiki);
* adapters for Web UI frameworks:
  * [DevExtreme](https://github.com/do-/node-doix-devextreme/wiki), 
  * [w2ui](https://github.com/do-/node-doix-w2ui/wiki).

To avoid version collisions, they rely one on another as [peer dependencies](https://nodejs.org/en/blog/npm/peer-dependencies). So should do your application.

# See also

More documentaion at https://github.com/do-/node-doix/wiki
