Minimalistic query builder

Usage:

```ts
const query = new QueryBuilder().each((_) => {
  _.each((_) => {
    _.equals("field1", "1");
    _.in("field1", ["1", "2", "3"]);
    _.any((_) => {
      _.in("field2.a", ["a1", "a2", "a3"]);
      _.in("field2.b", ["b1", "b2", "b3"]);
    });
  });
});
```

Then use specific parser:

```ts
query.mongo();
```
