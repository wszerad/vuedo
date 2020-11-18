# vuedo

## useSorter
```typescript
const sorter = useSorter({
  // default sorting rules
  // name: (x, y, def) => def(x, y)
  // provide custom sorter or for complex data
});
const arr = ref([
  {name: 'name0'},
  {name: 'name1'}
]);
const sorted = sorter.getSorted(arr);
// sorter.key.value & sorter.desc.value - to set sorting
```

## usePromise
```typescript
const promise = ref(invalidate => {
  return new Promise((res, rej) => {
    invalidate(rej);  // called if promise.value changes before fulfill
    setTimeout(res, 1000);
  });
});
// can be called with Promise / ref<Promise> / ref<PromiseFactoryWithInvalidation>
const promiseState = usePromise(promise);
// promiseState: {
//    pending: ref()
//    fulfilled: ref()
//    finished: ref()
//    rejected: ref()
//    error: ref()
// }
```

## useService
```typescript
class ServiceFactory {
  field = 'test';
  constructor(field: string) {
    this.field = field;
  }
}
// create ServiceFactory instance
// prodiver called outside component will provide globally
provideService(ServiceFactory);
// create ServiceFactory instance manually
provideService(ServiceFactory, () => new ServiceFactory('test2'));

// to get service instance
useService(ServiceFactory)
```
