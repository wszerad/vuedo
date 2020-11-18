import { provide, inject, getCurrentInstance } from 'vue';

const globalContext = new Map<symbol, any>();

// TODO better type checking?
export type ServiceCreator<T> = () => T;
export type ServiceFactory<T> = new (...args: any[]) => T

export function provideService<T>(service: ServiceFactory<T>, creator?: ServiceCreator<T>) {
  const { name } = service;
  const instance = creator ? creator() : new service();
  const key = Symbol.for(name);

  if (!getCurrentInstance()) {
    globalContext.set(key, instance);
    return instance;
  }

  provide(key, instance);
  return instance;
}

export function useService<T>(service: ServiceFactory<T>): T {
  const key = Symbol.for(service.name);
  if (!getCurrentInstance()) {
    return globalContext.get(key);
  }

  return inject(Symbol.for(service.name), globalContext.get(key));
}
