export const propsChanged = (lastProps, props) => {
  return (
    !lastProps ||
    Object.keys(lastProps).length !== Object.keys(props).length ||
    JSON.stringify(lastProps) !== JSON.stringify(props)
  );
};
