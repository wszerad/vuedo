export type Test<T> = (i: T) => boolean;

type Condition<T> = T extends Array<infer I>
	? { length: number | Test<number> } | ConditionMap<I> | Test<T>
	: Test<T> | T | ConditionMap<T>;

type ConditionMap<T> = {
	[S in keyof T]?: Condition<T[S]>;
}

const equalMap = new Map<any, any>();

function isSimpleType(t: any) {
  return Object(t) !== t;
}

function isDateType<T>(t: T): boolean {
  return t instanceof Date;
}

function extractCondition([key, value]: [string, any]): Test<any> {
  if (typeof value === 'function') {
    return (i: any) => value(i[key]);
  }

  if (typeof value === 'object') {
    const test = $match(value as any);
    return (i: any) => test(i[key]);
  }

  const test = $eq(value);
  return (i: any) => test(i[key]);
}

export function $match<T>(map: ConditionMap<T>) {
  return Object.entries(map)
    .map(extractCondition)
    .reduce((test: Test<any> | null, subtest) => (test
      ? (i) => test(i) && subtest(i)
      : (i) => subtest(i)), null) as Test<T>;
}

export function $eq(value: any): (i: any) => boolean {
  if (isSimpleType(value)) {
    return (i) => value === i;
  }

  if (isDateType(value)) {
    return (i: Date) => value.getTime() === i.getTime();
  }

  if (Array.isArray(value)) {
    return (i) => (
      value.length === i.length
			&& value.every((x, index: number) => $eq(x)(value[index]))
    );
  }

  const test = equalMap.get(value);
  if (test) {
    return (xal) => test(xal, value);
  }

  return (xal) => value === xal;
}

export function $gt(value: number) {
  return (i: number) => i > value;
}

export function $lt(value: number) {
  return (i: number) => i < value;
}

export function $gte(value: number) {
  return (i: number) => i >= value;
}

export function $lte(value: number) {
  return (i: number) => i <= value;
}

export function $index<T>(index: number, map: ConditionMap<T>) {
  const test = $match(map);

  return (index < 0)
    ? (i: T[]) => test(i.slice(index)[0])
    : (i: T[]) => test(i[index]);
}

export function $some<T>(map: ConditionMap<T>) {
  const test = $match(map);
  return (i: T[]) => i.some(test);
}

export function $every<T>(map: ConditionMap<T>) {
  const test = $match(map);
  return (i: T[]) => i.every(test);
}

export function $in<T>(items: T[]) {
  return (xtems: T[]) => items.every((i) => xtems.some($eq(i)));
}

export function $out<T>(items: T[]) {
  return (xtems: T[]) => !items.some((i) => xtems.some($eq(i)));
}

export function $or<T>(...ors: Test<T>[]) {
  return ors.reduce((test: Test<T> | null, cond) => (test
    ? (i) => test(i) || cond(i)
    : (i) => cond(i)), null);
}

export function $and<T>(...ands: Test<T>[]) {
  return ands.reduce((test: Test<T> | null, cond) => (test
    ? (i) => test(i) && cond(i)
    : (i) => cond(i)), null);
}

const notFuu = {
  $match,
  $eq,
  $gt,
  $lt,
  $gte,
  $lte,
  $index,
  $some,
  $every,
  $in,
  $out,
  $or,
  $and,
};

export const $not: typeof notFuu = Object
  .values(notFuu)
  .reduce((acc: any, test: any) => {
    acc[test.name] = (arg: any) => {
      const cache = test(arg);
      return (i: any) => !cache(i);
    };
    return acc;
  }, {} as any) as any;
