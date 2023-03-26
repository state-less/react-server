import { Store } from './MemoryStore';

describe('MemoryStore', () => {
  let store;
  it('should be able to create a new store', () => {
    store = new Store({});
    expect(store).toBeDefined();
  });

  it('should be able to create a new state', () => {
    store.createState(null, { key: 'test', scope: 'test' });
    expect(
      store.hasState(Store.getKey({ key: 'test', scope: 'test' }))
    ).toBeTruthy();
  });

  it('should automatically create a new state if it does not exist', () => {
    const state = store.getState('testasd', {});
    expect(state).toBeDefined();
  });

  it('should be able to get the same state if it exists', () => {
    const state = store.getState('testasd', {});
    expect(state).toBeDefined();
  });

  it('should always get the same state', () => {
    const state1 = store.getState('test', {});
    const state2 = store.getState('test', {});
    expect(state1).toBe(state2);
  });
});
