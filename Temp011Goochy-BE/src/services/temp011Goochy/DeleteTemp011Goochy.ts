import {
	DeleteItemCommand,
	DynamoDBClient,
	UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { hasAdminGroup } from "../shared/Utils";

export async function deleteTemp011Goochy(
	event: APIGatewayProxyEvent,
	ddbClient: DynamoDBClient
): Promise<APIGatewayProxyResult> {
	if (!hasAdminGroup(event)) {
		return {
			statusCode: 401,
			body: JSON.stringify(`Not authorized!`),
		};
	}

	if (event.queryStringParameters && "id" in event.queryStringParameters) {
		const temp011GoochyId = event.queryStringParameters["id"];

		await ddbClient.send(
			new DeleteItemCommand({
				TableName: process.env.TABLE_NAME,
				Key: {
					id: { S: temp011GoochyId },
				},
			})
		);

		return {
			statusCode: 200,
			body: JSON.stringify(`Deleted temp011Goochy with id ${temp011GoochyId}`),
		};
	}
	return {
		statusCode: 400,
		body: JSON.stringify("Please provide right args!!"),
	};
}
