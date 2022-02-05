import crypto from 'crypto';

import {recover as web3Recover} from '../lib/web3-util'
export const getIdentity = ({web3 : token}) => token;
export const getAddress = ({web3 : token}) => ({id: token, strat: 'web3', name: token});

export const recover = (json) => {
    const {challenge, response} = json;
    return {web3: web3Recover(challenge, response)}
}
export const challenge = () => {
    return new Promise ((resolve, ) => {
        crypto.randomBytes(8, function (err, buffer) {
            const token = buffer.toString('hex');
            resolve ({
                type: 'sign',
                challenge: `Please sign this message to prove your identity: ${token}`
            });
        });
    })
}