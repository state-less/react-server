import { v4 } from 'uuid';
import { StateOptions } from '../store/MemoryStore';
import { ClientContext, ReactServerComponent, RequestContext } from './types';
import jwt from 'jsonwebtoken';
import { PartialAuth } from '../types/auth';

export const serverKey = 'server';

export const createId = (debugHint) => {
  return v4();
};

export const clientKey = (key, requestContext: RequestContext) => {
  return `${key}::${
    (requestContext as ClientContext)?.headers?.['x-unique-id'] || serverKey
  }`;
};

export const generateComponentPubSubKey = (
  component: ReactServerComponent<any>,
  requestContext: ClientContext
) => {
  return `component::${requestContext.headers['x-unique-id']}::${component.key}`;
};

export const isStateOptions = (options: any): options is StateOptions => {
  return options && options.scope && options.key;
};

export const authenticate = (
  headers: Record<string, string>,
  secret: string = process.env.JWT_SECRET
): PartialAuth<unknown> => {
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
