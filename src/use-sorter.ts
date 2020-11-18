import { ref, Ref, computed } from 'vue';

const intlComparator = new Intl
  .Collator(undefined, {
    numeric: true, sensitivity: 'base', usage: 'sort',
  })
  .compare;

function defaultSorter<T>(x: T, y: T) {
  if (x == null) {
    return y == null ? 0 : -1;
  }
  if (y == null) {
    return 1;
  }
  return intlComparator(x as any, y as any);
}

type SorterMap<T> = {
  [P in keyof T]?: Sorter<T[P]>;
};
type Sorter<T> = (x: T, y: T, defaultComparator: typeof defaultSorter) => number;

export function useSorter<T>(sorters: SorterMap<T> = {}) {
  const key = ref<string | false>(false);
  const decr = ref<boolean>(true);

  function getSorted(items: Ref<T[]>) {
    return computed(() => {
      if (!key.value) {
        return (decr.value) ? items.value.reverse() : items.value;
      }

      const sorter: Sorter<T[keyof T]> = ((sorters as any)?.[key.value] || defaultSorter);
      const sorted = items.value.sort((x: any, y: any) =>
        sorter(x[key.value as string], y[key.value as string], defaultSorter));
      return (decr.value) ? sorted.reverse() : sorted;
    });
  }

  return {
    key,
    decr,
    getSorted,
  };
}
