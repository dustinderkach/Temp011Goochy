import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { validateAsTemp011GoochyEntry } from "../shared/Validator";
import { marshall } from "@aws-sdk/util-dynamodb";
import { createRandomId, parseJSON } from "../shared/Utils";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
//import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const s3Client = new S3Client({ region: process.env.AWS_REGION });
//const ssmClient = new SSMClient({ region: process.env.AWS_REGION });

export async function postTemp011Goochy(
	event: APIGatewayProxyEvent,
	ddbClient: DynamoDBClient
): Promise<APIGatewayProxyResult> {
	const randomId = createRandomId();
	const item = parseJSON(event.body);
	item.id = randomId;
	validateAsTemp011GoochyEntry(item);
    // // Fetch the bucket ARN from SSM Parameter Store
    // const parameterName = `/${process.env.ENV_NAME}/Temp011GoochyAdminPhotosBucketArn`;
    // const parameterResponse = await ssmClient.send(
    //     new GetParameterCommand({ Name: parameterName })
    // );

    // if (!parameterResponse.Parameter || !parameterResponse.Parameter.Value) {
    //     throw new Error(`Failed to retrieve bucket ARN from SSM parameter: ${parameterName}`);
    // }

    // const bucketArn = parameterResponse.Parameter.Value;

    // Fetch the bucket ARN from the configuration table
    const configTableName = process.env.CONFIG_TABLE_NAME;
    if (!configTableName) {
        throw new Error("CONFIG_TABLE_NAME environment variable is not defined.");
    }

    const getItemCommand = new GetItemCommand({
        TableName: configTableName,
        Key: {
            ConfigKey: { S: "Temp011GoochyAdminPhotosBucketArn" }, // Key for the bucket ARN
        },
    });

    const configResponse = await ddbClient.send(getItemCommand);

    if (!configResponse.Item || !configResponse.Item.ConfigValue) {
        throw new Error(
            `Failed to retrieve bucket ARN from configuration table: ${configTableName}`
        );
    }
    // Extract the bucket name from the ARN
    const bucketName = configResponse.Item.ConfigValue.S;
	

		const fileName = `${randomId}-${item.fileName}`;
		const command = new PutObjectCommand({
			Bucket: bucketName,			
			Key: fileName,
			ContentType: "application/octet-stream", // Adjust based on file type
		});

		const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes


	const result = await ddbClient.send(
		new PutItemCommand({
			TableName: process.env.TABLE_NAME,
			Item: marshall(item),
		})
	);

	return {
		statusCode: 201,
		body: JSON.stringify({ id: randomId, signedUrl }),
	};
}
