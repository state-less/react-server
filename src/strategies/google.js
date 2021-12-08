const jwt = require('jsonwebtoken');

const pem = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ…cQvdi82UgJIPjg/ZbMt\nUwIDAQAB\n-----END PUBLIC KEY-----\n"

export const recover = (challenge, response) => {
    const token = jwt.verify(response, pem);
    return token
}