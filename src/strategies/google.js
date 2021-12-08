const jwt = require('jsonwebtoken');

export const recover = (challenge, response) => {
    const token = jwt.verify(response);
    return token
}