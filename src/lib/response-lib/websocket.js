const {success: successHTTP, failure: failureHTTP} = require('./')

const success = (data, meta) => {
    return JSON.stringify({...successHTTP(data, false), ...meta})
}

const failure = (data, meta) => {
    return JSON.stringify({...failureHTTP(data, false), ...meta})
}

module.exports = {
    success,
    failure
}