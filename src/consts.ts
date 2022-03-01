export const EVENT_STATE_USE = "useState";
export const EVENT_STATE_PERMIT = "permitState";
export const EVENT_STATE_DECLINE = "declineState";
export const EVENT_STATE_SET = "setState";
export const EVENT_STATE_CREATE = "createState";
export const EVENT_STATE_REQUEST = "requestState";
export const EVENT_STATE_ERROR = "error";

export const EVENT_SCOPE_CREATE = "createScope";

export const CACHE_FIRST = "CACHE_FIRST";
export const NETWORK_FIRST = "NETWORK_FIRST";
export const SERVER_ID = "server";

export const ACTION_RENDER = "render";
export const ACTION_STREAM = "stream";
export const ACTION_AUTH = "auth";
export const ACTION_LOGOUT = "logout";
export const ACTION_CALL = "call";
export const ACTION_USE_STATE = "useState";
export const ACTION_SET_STATE = "setState";

export const SCOPE_CLIENT = "$client";
export const SCOPE_SERVER = "$server";
export const SCOPE_COMPONENT = "$component";

export const ERR_MISSING_KEY = `Missing property 'key' in component props.`;
export const ERR_NOT_AUTHORIZED = "Not authorized";
export const ERR_NO_ROUTER_CONTEXT =
  "Cannot render a route outside the context of a router. Are you missing a router?";
export const DESC_MISSING_KEY = `A key is required to be able to map the client component to a Server component.`;
