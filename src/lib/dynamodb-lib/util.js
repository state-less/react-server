const AWS = require("aws-sdk");

const parse = AWS.DynamoDB.Converter.output;

const parseDynamoJSON = (data)=> {
    try {
        console.log ("Parsing dynamodb json", data);
        let parsed = parse ({M: data});
        console.log ("Parsed dynamo jso9n", parsed)
        return parsed;
    } catch (e) {
        caught`Error ${e} parsing Dynamo JSON.`
    }
}

const parseTableFromEventSourceArn = (arn) => {
    return arn.split ('/')[1];
}

module.exports = {
    parseDynamoJSON,
    parseTableFromEventSourceArn
}