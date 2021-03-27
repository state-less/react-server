"use strict";

function buildResponse(statusCode, body = '', headers) {
  const response = {
    statusCode,
    body: JSON.stringify(body)
  };

  if (headers) {
    Object.assign(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      }
    });
  }

  return response;
}

function success(body, headers) {
  return buildResponse(200, body, headers);
}

function failure(body, headers) {
  return buildResponse(500, body, headers);
}

module.exports = {
  success,
  failure
};