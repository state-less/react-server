import { v4 } from 'uuid';
import { StateOptions } from '../store/MemoryStore';
import { ReactServerComponent } from './types';
import jwt from 'jsonwebtoken';

export const createId = (debugHint) => {
  return v4();
};

export const generateComponentPubSubKey = (
  component: ReactServerComponent<any>
) => {
  return `component::${component.key}`;
};

export const isStateOptions = (options: any): options is StateOptions => {
  return options && options.scope && options.key;
};

export const authenticate = (headers, secret = process.env.JWT_SECRET) => {
  const token = headers?.authorization;

  if (!token) throw new Error('Not authorized');

  const bearer = token.split(' ')[1];

  try {
    const decoded = jwt.verify(bearer, secret);

    if (decoded) {
      return decoded;
    }
  } catch (e) {
    throw new Error('Not authorized');
  }
};
