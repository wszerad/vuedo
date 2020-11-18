import {
  $gte, $in, $match, $not, $out, $some,
} from '../..';
import { PromiseCreator, usePromise } from '../..';
import { expect } from 'chai';
import { ref } from 'vue';

function promiseFactory() {
  const state = {
    promise: Promise.resolve(undefined),
    resolve: (v: any) => {},
    reject: (v: any) => {}
  };
  state.promise = new Promise((res, rej) => {
    state.resolve = res;
    state.reject = rej;
  });
  return state;
}

describe('vuedo', () => {
  describe('usePromise', () => {
    it('should pass Promise input', async () => {
      const { promise, resolve } = promiseFactory();
      const {
        pending, error, finished, rejected, fulfilled,
      } = usePromise(promise);

      expect(pending.value).to.equal(true);
      expect(finished.value || rejected.value || fulfilled.value).to.equal(false);
      expect(error.value).to.equal(null);

      resolve(true);

      expect(await promise).to.equal(true);
      expect(pending.value || rejected.value).to.equal(false);
      expect(finished.value).to.equal(true);
      expect(fulfilled.value).to.equal(true);
      expect(error.value).to.equal(null);
    });

    it('should pass Ref<Promise> input', async () => {
      const input = ref();
      const { promise, resolve } = promiseFactory();
      input.value = promise;
      const { fulfilled } = usePromise(input);

      resolve(true);

      expect(await promise).to.equal(true);
      expect(fulfilled.value).to.equal(true);
    });

    it('should reset state after input change', async () => {
      const input = ref();
      const pf = promiseFactory();
      input.value = pf.promise;
      const {
        pending, error, finished, rejected, fulfilled,
      } = usePromise(input);

      pf.resolve(true);
      expect(await pf.promise).to.equal(true);

      const pf2 = promiseFactory();
      input.value = pf2.promise;

      expect(pending.value).to.equal(true);
      expect(finished.value || rejected.value || fulfilled.value).to.equal(false);
      expect(error.value).to.equal(null);

      pf2.resolve(false);
      expect(await pf2.promise).to.equal(false);
      expect(fulfilled.value).to.equal(true);
    });

    it('should reset state after input change even before finish', async () => {
      const input = ref();
      const pf = promiseFactory();
      input.value = pf.promise;
      const { fulfilled } = usePromise(input);

      const pf2 = promiseFactory();
      input.value = pf2.promise;

      pf2.resolve(false);

      expect(await pf2.promise).to.equal(false);
      expect(fulfilled.value).to.equal(true);

      pf.resolve(true);
      expect(await pf.promise).to.equal(true);
    });

    it('should not start null ref', async () => {
      const input = ref();
      input.value = null;
      const {
        pending, error, finished, rejected, fulfilled,
      } = usePromise(input);
      expect(finished.value && rejected.value && fulfilled.value && pending.value).to.equal(false);
      expect(error.value).to.equal(null);
    });

    it('should reset state after input change and stop id null', async () => {
      const input = ref();
      const pf = promiseFactory();
      input.value = pf.promise;
      const {
        pending, error, finished, rejected, fulfilled,
      } = usePromise(input);

      pf.resolve(true);
      expect(await pf.promise).to.equal(true);

      input.value = null;
      expect(finished.value && rejected.value && fulfilled.value && pending.value).to.equal(false);
      expect(error.value).to.equal(null);
    });

    it('should pass Ref<function> input', async () => {
      const input = ref();
      const { promise, resolve } = promiseFactory();
      input.value = () => promise;
      const { pending } = usePromise(input);

      expect(pending.value).to.equal(true);

      resolve('fuu');

      expect(await promise).to.equal('fuu');
    });

    it('should trigger intermediate if input change', async () => {
      let terminated = false;
      const { promise, resolve } = promiseFactory();
      const creator: PromiseCreator = (inv: (arg0: () => void) => void) => {
        inv(() => {
          terminated = true;
        });

        return promise;
      };
      const input = ref<any>(creator);

      usePromise(input);
      resolve(true);
      input.value = null;
      expect(terminated).to.equal(true);
    });

    it('should catch error', async () => {
      const { promise, reject } = promiseFactory();
      const input = ref(promise);

      const { error, rejected } = usePromise(input);
      reject(true);
      await promise.catch(() => {});

      expect(rejected.value).to.equal(true);
      expect(error.value).to.equal(true);
    });
  });

  describe('useCollection', () => {
    const item = {
      name: 'name0',
      index: 0,
      array: [0, 1, 2],
      nested: {
        name: 'nested0',
        index: 0,
      },
      nestedArray: [
        { arr: [0] },
        { arr: [1] },
      ],
    };

    it('simple match', async () => {
      const test = $match<typeof item>({
        name: 'name0',
      });
      expect(test(item)).to.equal(true);
    });

    it('chain match', async () => {
      const test = $match<typeof item>({
        name: 'name1',
        index: 0,
      });
      expect(test(item)).to.equal(false);
    });

    it('negative chain match', async () => {
      const test = $match<typeof item>({
        name: 'name0',
        index: 0,
      });
      expect(test(item)).to.equal(true);
    });

    it('nested match', async () => {
      const test = $match<typeof item>({
        nested: {
          name: 'nested0',
        },
      });
      expect(test(item)).to.equal(true);
    });

    it('$in', async () => {
      const test = $match<typeof item>({
        array: $in([0]),
      });
      expect(test(item)).to.equal(true);
    });

    it('$in negative', async () => {
      const test = $match<typeof item>({
        array: $in([3]),
      });
      expect(test(item)).to.equal(false);
    });

    it('array len', async () => {
      const test = $match<typeof item>({
        array: {
          length: $gte(2),
        },
      });
      expect(test(item)).to.equal(true);
    });

    it('$out', async () => {
      const test = $match<typeof item>({
        array: $out([3]),
      });
      expect(test(item)).to.equal(true);
    });

    it('$out negative', async () => {
      const test = $match<typeof item>({
        array: $out([3]),
      });
      expect(test(item)).to.equal(true);
    });

    it('$some', async () => {
      const test = $match<typeof item>({
        nestedArray: $some({ arr: $in([0]) }),
      });
      expect(test(item)).to.equal(true);
    });

    it('$some negative', async () => {
      const test = $match<typeof item>({
        nestedArray: $some({ arr: $in([2]) }),
      });
      expect(test(item)).to.equal(false);
    });

    it('$not', async () => {
      const test = $match<typeof item>({
        nestedArray: $not.$some({ arr: $in([3]) }),
      });
      expect(test(item)).to.equal(true);
    });

    it('$not negative', async () => {
      const test = $match<typeof item>({
        nestedArray: $not.$some({ arr: $in([0]) }),
      });
      expect(test(item)).to.equal(false);
    });
  });
});
