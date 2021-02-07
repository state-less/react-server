
const ClientComponent = (props) => {
    return {
        component: 'ClientComponent',
        props
    }
}
ClientComponent.server = true;

const Action = (props) => {
    const {children: name, ...rest} = props;
    return {
        component: 'Action',
        props: {
            name,
            handler: rest
        }
    }
}
Action.server = true;

module.exports = {
    ClientComponent,
    Action
}