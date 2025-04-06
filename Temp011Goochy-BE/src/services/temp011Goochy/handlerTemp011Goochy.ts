import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	APIGatewayProxyEvent,
	APIGatewayProxyResult,
	Context,
} from "aws-lambda";
import { postTemp011Goochy as postTemp011Goochy } from "./PostTemp011Goochy";
import { getTemp011Goochy } from "./GetTemp011Goochy";
import { updateTemp011Goochy } from "./UpdateTemp011Goochy";
import { deleteTemp011Goochy } from "./DeleteTemp011Goochy";
import { JsonError, MissingFieldError } from "../shared/Validator";
import { addCorsHeader } from "../shared/Utils";
import { captureAWSv3Client, getSegment } from "aws-xray-sdk-core";

//const ddbClient = captureAWSv3Client(new DynamoDBClient({}));
const ddbClient = captureAWSv3Client
	? captureAWSv3Client(new DynamoDBClient({}))
	: new DynamoDBClient({});

async function handlerTemp011Goochy(
	event: APIGatewayProxyEvent,
	context: Context
): Promise<APIGatewayProxyResult> {
	let response: APIGatewayProxyResult;

	try {
		switch (event.httpMethod) {
			case "GET":
				const subSegGET =
					getSegment().addNewSubsegment("GET-Temp011Goochy");
				const getResponse = await getTemp011Goochy(event, ddbClient);
				subSegGET.close();
				response = getResponse;
				break;
			case "POST":
				const subSegPOST =
					getSegment().addNewSubsegment("POST-Temp011Goochy");
				const postResponse = await postTemp011Goochy(event, ddbClient);
				subSegPOST.close();
				response = postResponse;
				break;
			case "PUT":
				const subSegPUT =
					getSegment().addNewSubsegment("PUT-Temp011Goochy");
				const putResponse = await updateTemp011Goochy(event, ddbClient);
				subSegPUT.close();
				response = putResponse;
				break;
			case "DELETE":
				const subSegDELETE =
					getSegment().addNewSubsegment("DELETE-Temp011Goochy");
				const deleteResponse = await deleteTemp011Goochy(event, ddbClient);
				subSegDELETE.close();
				response = deleteResponse;
				break;
			default:
				break;
		}
	} catch (error) {
		if (error instanceof MissingFieldError) {
			return {
				statusCode: 400,
				body: error.message,
			};
		}
		if (error instanceof JsonError) {
			return {
				statusCode: 400,
				body: error.message,
			};
		}
		return {
			statusCode: 500,
			body: error.message,
		};
	}
	addCorsHeader(response);
	return response;
}


export { handlerTemp011Goochy };
