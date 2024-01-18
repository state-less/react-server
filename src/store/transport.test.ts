import { Store } from './MemoryStore';
import { PostgresTransport, Transport } from './transport';

describe('transport', () => {
  it('should be able to create a transport', () => {
    const transport = new Transport();
    expect(transport).toBeDefined();
  });

  it('should be able to create a postgres transport', () => {
    const transport = new PostgresTransport({
      connectionString:
        'postgres://postgres:mysecretpassword@localhost:5433/postgres',
    });
    expect(transport).toBeDefined();
  });

  it('should be able to set a state', async () => {
    const transport = new PostgresTransport({
      connectionString:
        'postgres://postgres:mysecretpassword@localhost:5433/postgres',
    });
    const store = new Store({ transport });
    const state = store.createState('hello', { scope: 'test', key: 'test' });
    expect(state.value).toBe('hello');
    await state.setValue('world');
    expect(state.value).toBe('world');
  });

  it('should be able to get a state', async () => {
    const transport = new PostgresTransport({
      connectionString:
        'postgres://postgres:mysecretpassword@localhost:5433/postgres',
    });
    const store = new Store({ transport });
    const state = store.createState('hello', { scope: 'test', key: 'test' });
    expect(state.value).toBe('hello');
    await state.getValue();
    expect(state.value).toBe('world');
  });
});
