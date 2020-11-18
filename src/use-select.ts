import {
  Ref, ref, reactive, computed, watch,
} from 'vue';

function defaultComparator<T, I>(item: T): I {
  return (item as any).id;
}

interface Toggle<T> {
	(item: T, checked: boolean): void;

	(items: T[], checked: boolean): void;
}

interface ToggleById<I> {
	(id: I, checked: boolean): void;

	(ids: I[], checked: boolean): void;
}

interface IdSelector<T, I> {
	(item: T): I;
}

interface IsSelected<T> {
	(item: T): Ref<boolean>;

	(items: T[]): Ref<boolean>;
}

export function useSelected<T, I>(items: Ref<T[]>, selectId: IdSelector<T, I> = defaultComparator, preserveSelected = true) {
  const all = ref(false);
  const selected = reactive(new Set<I>());

  if (!preserveSelected) {
    watch(items, () => {
      const ids = new Set(items.value.map(selectId));
      selected.forEach((id) => {
        if (!ids.has(id)) {
          selected.delete(id);
        }
      });
    });
  }

  const toggleById: ToggleById<I> = (ids: any, checked: boolean) => {
    if (!checked && all.value) {
      all.value = false;
    }

    [].concat(ids).forEach((id) => {
      checked ? selected.add(id) : selected.delete(id);
    });
  };

  const toggle: Toggle<T> = (items: any, checked: boolean) => {
    toggleById([].concat(items).map(selectId), checked);
  };

  const toggleAll = (checked: boolean) => {
    all.value = checked;
    selected.clear();
  };

  const isSelected: IsSelected<T> = (items: any) => {
    const ids = [].concat(items).map(selectId);
    return computed(() => all.value || ids.every((id) => selected.has(id)));
  };

  const allSelected = computed(() => all.value || selected.size === items.value.length);

  const partlySelected = computed(() => !all.value && selected.size);

  const getSelected = (fromItems?: T[]) => computed(() => {
    const i = (fromItems || items.value);
    if (all.value) {
      return i;
    }

    return i.filter((i) => selected.has(selectId(i)));
  });

  return {
    toggleById,
    toggle,
    toggleAll,
    isSelected,
    allSelected,
    partlySelected,
    getSelected,
  };
}
