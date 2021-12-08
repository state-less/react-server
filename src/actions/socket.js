import {ACTION_RENDER} from '../consts';


export const RenderAction = (rest) => ({ action: ACTION_RENDER, routeKey: ACTION_RENDER, ...rest })
export const RenderErrorAction = (rest) => RenderAction({type: 'error'});

export const SocketErrorAction = (rest) => ({type: 'error'});