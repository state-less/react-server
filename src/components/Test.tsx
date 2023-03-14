import { useState } from '../lib/reactServer';

const ServerSideProps = (props) => {
  const { children, ...rest } = props;
  return {
    props: rest,
    children,
  };
};

type Props<T> = {
  key: string;
} & T;

type PropsWithChildren<T> = Props<{
  children?: unknown;
}> &
  T;

export const TestComponent = (_props: PropsWithChildren<unknown>) => {
  const [value, setValue] = useState(1, { key: 'ASD', scope: 'Asd' });
  return <ServerSideProps value={value} />;
};
