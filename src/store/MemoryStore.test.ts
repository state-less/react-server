import { Store } from './MemoryStore';

describe('MemoryStore', () => {
  let store;
  it('should be able to create a new store', () => {
    store = new Store({ scope: 'root' });
    expect(store).toBeDefined();
  });

  it('should be able to create a new state', () => {
    store.createState(null, { key: 'test', scope: 'root' });
    expect(store.hasState('test')).toBeTruthy();
  });

  it('should automatically create a new state if it does not exist', () => {
    const state = store.getState('testasd', { scope: 'root' });
    expect(state).toBeDefined();
  });

  it('should be able to get the same state if it exists', () => {
    const state = store.getState('testasd', { scope: 'root' });
    expect(state).toBeDefined();
  });

  it('should always get the same state', () => {
    const state1 = store.getState('test', { scope: 'root' });
    const state2 = store.getState('test', { scope: 'root' });
    expect(state1).toBe(state2);
  });
});
