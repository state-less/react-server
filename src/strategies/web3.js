export { recover } from '../lib/web3-util'
export const getIdentity = (token) => token;
export const getAddress = (token) => ({name: token, email: null, picture: null});