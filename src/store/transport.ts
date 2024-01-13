import pgPromise from 'pg-promise';
import { State } from './MemoryStore';

export class Transport {
  constructor() {}
  setState(state: State<any>) {
    throw new Error('Not implemented');
  }
  getState<T>(scope: string, key: string): Promise<State<T> | null> {
    throw new Error('Not implemented');
  }
}

export class PostgresTransport extends Transport {
  connectionString: string;
  _db: any;
  constructor({ connectionString }) {
    super();

    if (!connectionString) {
      throw new Error('connectionString is required');
    }

    const db = pgPromise({})(connectionString);
    try {
      db.connect().then(() => console.log('Connected'));
    } catch (e) {
      throw new Error('Unable to connect to database');
    }
    this._db = db;
  }

  async setState(state: State<unknown>) {
    const { scope, key, value } = state;
    const query = `INSERT INTO states (scope, key, value) VALUES ($1, $2, $3) ON CONFLICT (scope, key) DO UPDATE SET value = $3`;
    const result = await this._db.query(query, [scope, key, { value }]);

    return result;
  }

  async getState<T>(scope: string, key: string): Promise<State<T> | null> {
    const query = `SELECT * FROM states WHERE scope = $1 AND key = $2`;

    const result = await this._db.query(query, [scope, key]);

    if (result.length === 0) {
      return null;
    }
    return result[0].value;
  }
}
