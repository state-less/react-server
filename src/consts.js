const EVENT_STATE_USE = 'useState';
const EVENT_STATE_PERMIT = 'permitState';
const EVENT_STATE_DECLINE = 'declineState';
const EVENT_STATE_SET = 'setState';
const EVENT_STATE_CREATE = 'createState';
const EVENT_STATE_REQUEST = 'requestState';
const EVENT_STATE_ERROR = 'error';


const EVENT_SCOPE_CREATE = 'createScope';

const CACHE_FIRST = 'CACHE_FIRST';
const NETWORK_FIRST = 'NETWORK_FIRST';
const SERVER_ID = 'server';

export const ACTION_RENDER = 'render';
export const ACTION_STREAM = 'stream';
export const ACTION_AUTH = 'auth';
export const ACTION_CALL = 'call';
export const ACTION_USE_STATE = 'useState';

const SCOPE_CLIENT = '$client';
const SCOPE_SERVER = '$server';
const SCOPE_COMPONENT = '$component';

const ERR_MISSING_KEY = `Missing property 'key' in component props.`
const DESC_MISSING_KEY = `A key is required to be able to map the client component to a Server component.`
module.exports = {
    EVENT_STATE_ERROR, EVENT_STATE_DECLINE, EVENT_STATE_PERMIT, EVENT_STATE_SET, EVENT_STATE_USE,EVENT_STATE_CREATE, EVENT_STATE_REQUEST, EVENT_SCOPE_CREATE,
    CACHE_FIRST, NETWORK_FIRST, SERVER_ID,
     SCOPE_CLIENT, SCOPE_SERVER, SCOPE_COMPONENT,
    ERR_MISSING_KEY,
    DESC_MISSING_KEY,
}