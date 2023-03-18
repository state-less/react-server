import { v4 } from 'uuid';
import { ReactServerComponent } from './types';

export const createId = (debugHint) => {
  return v4();
};

export const generateComponentPubSubKey = (
  component: ReactServerComponent<any>
) => {
  return `component::${component.key}`;
};
