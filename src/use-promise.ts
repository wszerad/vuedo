import {
  reactive, Ref, computed, shallowRef, watch, isRef,
} from 'vue';

interface PromiseState<E> {
	pending: boolean;
	fulfilled: boolean;
	rejected: boolean;
	finished: boolean;
	error: E | null;
}

function promiseState<E>(): PromiseState<E> {
  return reactive({
    pending: false,
    fulfilled: false,
    rejected: false,
    finished: false,
    error: null,
  });
}

export type PromiseCreator = (invalidate: (cb: () => void) => void) => Promise<any>;

export function usePromise<E = any>(
  promise: Ref<undefined | null | Promise<any> | PromiseCreator> | Promise<any>,
) {
  const promiseRef = isRef(promise) ? promise : shallowRef(promise);
  const state = shallowRef<PromiseState<E>>(promiseState());

  watch(promiseRef, (promise, old, invalidate) => {
    let trigger;
    state.value = promiseState();

    if (typeof promise === 'function') {
      trigger = promise(invalidate);
    } else {
      trigger = promise;
    }

    if (!trigger) {
      return;
    }

    wrap(trigger, state.value);
  }, { deep: false, immediate: true, flush: 'sync' });

  function wrap(promise: Promise<any>, state: PromiseState<E>) {
    state.pending = true;

    promise.finally(() => {
      state.pending = false;
      state.finished = true;
    }).catch(() => true);

    promise.catch((e) => {
      state.rejected = true;
      state.error = e;
    });

    promise.then(() => {
      state.fulfilled = true;
    }).catch(() => true);
  }

  return {
    pending: computed(() => state.value.pending),
    fulfilled: computed(() => state.value.fulfilled),
    finished: computed(() => state.value.finished),
    rejected: computed(() => state.value.rejected),
    error: computed(() => state.value.error),
  };
}
