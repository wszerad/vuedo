import {
  computed, isRef, Ref, shallowRef, watch,
} from 'vue';
import { Test } from './$match';

export function useCollection<T, I>(items: Ref<T[]>, selectId: (item: T) => I = (i) => (i as any).id) {
  const map = shallowRef(new Map<I, T>());
  watch(items, (now) => {
    map.value.clear();
    map.value = new Map(now.map((i) => ([selectId(i), i])));
  }, { deep: false });

  return {
    getById(id: I | Ref<I>) {
      const normId = isRef(id) ? id : shallowRef(id);
      return computed(() => map.value.get(normId.value));
    },
    find(find: Test<T>) {
      return computed(() => items.value.find(find));
    },
    filter(filter: Test<T>) {
      return computed(() => items.value.filter(filter));
    },
  };
}
