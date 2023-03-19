import { v4 } from 'uuid';
import { StateOptions } from '../store/MemoryStore';
import { ReactServerComponent } from './types';

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
