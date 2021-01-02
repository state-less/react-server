
const ClientComponent = (props) => {
    return {
        component: 'ClientComponent',
        props
    }
}

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

module.exports = {
    ClientComponent,
    Action
}