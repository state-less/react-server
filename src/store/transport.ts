import pgPromise, { IDatabase, queryResult } from 'pg-promise';
import { State, StateOptions } from './MemoryStore';

export class Transport {
  constructor() {}
  setState<T>(state: State<any>): Promise<State<T> | null> {
    throw new Error('Not implemented');
  }
  setInitialState<T>(state: State<any>): Promise<State<T> | null> {
    throw new Error('Not implemented');
  }
  getState<T>(state: State<any>): Promise<State<T> | null> {
    throw new Error('Not implemented');
  }
}

export class PostgresTransport extends Transport {
  connectionString: string;
  _db: IDatabase<any>;
  constructor({ connectionString }) {
    super();

    if (!connectionString) {
      throw new Error('connectionString is required');
    }

    const db = pgPromise({})(connectionString);
    try {
      db.connect().then(() => console.log('Connected to database.'));
    } catch (e) {
      throw new Error('Unable to connect to database');
    }
    this._db = db;
  }

  async setState(state: State<unknown>) {
    const { scope, key, value, id, user, client } = state;
    const query = `INSERT INTO states (scope, key, uuid, "user", client, value) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (scope, key) DO UPDATE SET value = $6`;

    let retries = 0;
    try {
      const result = await this._db.query(query, [
        scope,
        key,
        id,
        user,
        client,
        { value },
      ]);
      return result;
    } catch (e) {
      if (retries < 3) {
        retries++;
        return new Promise((resolve) => {
          console.error(
            `Error setting state ${key}. Retrying...\n${e.message}`
          );
          setTimeout(async () => {
            resolve(await this.setState(state));
          }, 1000 * 10 * (retries - 1));
        });
      } else {
        throw e;
      }
    }
  }

  async setInitialState(state: State<unknown>) {
    const { scope, key, uuid, user, client, value } = state;
    const query = `INSERT INTO states (scope, key, uuid, "user", client, value) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`;

    let retries = 0;

    try {
      const result = await this._db.query(query, [
        scope,
        key,
        uuid,
        user,
        client,
        { value },
      ]);
      return result;
    } catch (e) {
      console.error('Error setting initial state:', e.message);
      if (retries < 3) {
        retries++;
        return new Promise((resolve) => {
          console.error(`Error setting state ${key}. Retrying...`);
          setTimeout(async () => {
            resolve(await this.setState(state));
          }, 1000 * 10 * (retries - 1));
        });
      } else {
        throw e;
      }
    }
  }

  async getState<T>(state: State<T>): Promise<State<T> | null> {
    const { scope, key, uuid } = state;
    const where = ['scope', 'key', 'uuid']
      .map((k, i) => `${k} = $${i + 1}`)
      .join(' AND ');

    const query = `SELECT * FROM states WHERE ${where}`;
    let retries = 0;
    try {
      const result = await this._db.query(query, [scope, key, uuid]);
      if (result.length === 0) {
        return null;
      }
      return result[0].value;
    } catch (e) {
      if (retries < 3) {
        retries++;
        return new Promise((resolve) => {
          console.error(`Error getting state ${key}. Retrying...`);
          setTimeout(async () => {
            resolve(await this.getState(state));
          }, 1000 * 10 * (retries - 1));
        });
      } else {
        throw e;
      }
    }
  }

  async queryByOptions<T>(
    stateOptions: StateOptions,
    retries?: number
  ): Promise<any> {
    const { uuid, user, key, client, scope } = stateOptions;
    const where = ['user', 'key', 'client', 'scope', 'uuid']
      .filter((k) => stateOptions[k])
      .map((k, i) => `${k} = $${i + 1}`)
      .join(' AND ');
    const query = `SELECT * FROM states WHERE ${where}`;

    console.log('QUERY', query);
    try {
      const result = await this._db.query(
        query,
        [user, key, client, scope, uuid].filter(Boolean)
      );
      console.log('RESULT', result);
      return result;
    } catch (e) {
      if (retries < 3) {
        return new Promise((resolve) => {
          console.error(`Error getting states for user ${user}. Retrying...`);
          setTimeout(async () => {
            resolve(
              await this.queryByOptions(
                {
                  user,
                  key,
                  client,
                  scope,
                },
                retries + 1
              )
            );
          }, 1000 * 10 * (retries - 1));
        });
      } else {
        throw e;
      }
    }
  }
}
