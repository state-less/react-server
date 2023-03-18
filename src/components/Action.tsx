export const FunctionCall = (props) => {
  return {
    component: props.component,
    name: props.name,
    args: [props.args],
    fn: props.fn,
  };
};
