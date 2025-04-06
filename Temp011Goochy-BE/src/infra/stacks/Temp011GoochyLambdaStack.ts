import { Duration, Fn, Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

interface Temp011GoochyLambdaStackProps extends StackProps {
	tableArn: string;
	tableName: string;
	envName: string;
	bucketName: string;
	bucketArn: string;
}

export class Temp011GoochyLambdaStack extends Stack {
	public readonly temp011GoochyLambdaIntegration: LambdaIntegration;

	constructor(
		scope: Construct,
		id: string,
		props: Temp011GoochyLambdaStackProps
	) {
		super(scope, id, props);

		// Create the SSM parameter in the same region as the Lambda stack
		const bucketArnParameter = new StringParameter(
			this,
			`/${props.envName}/Temp011GoochyAdminPhotosBucketArn`,
			{
				parameterName: `/${props.envName}/Temp011GoochyAdminPhotosBucketArn`,
				stringValue: props.bucketArn, // Use the ARN passed from the S3 stack
			}
		);

		const parameterArn = `arn:aws:ssm:${props.env?.region}:${props.env?.account}:parameter/${props.envName}/Temp011GoochyAdminPhotosBucketArn`;
		const parameterName = `/${props.envName}/Temp011GoochyAdminPhotosBucketArn`;
		// Write the parameter ARN to the console
		console.log("SSM Parameter ARN:", parameterArn);
		console.log("SSM Parameter Name:", parameterName);
		console.log("SSM Parameter Value:", props.bucketArn);
		console.log("SSM Parameter Region:", props.env?.region);

		const temp011GoochyLambda = new NodejsFunction(
			this,
			`${props.envName}-Temp011GoochyLambda`,
			{
				runtime: Runtime.NODEJS_18_X,
				handler: "handlerTemp011Goochy",
				entry: join(
					__dirname,
					"..",
					"..", // Move up two directories to reach 'src'
					"services",
					"temp011Goochy",
					"handlerTemp011Goochy.ts"
				),
				environment: {
					TABLE_NAME: props.tableName,
					BUCKET_ARN: props.bucketArn,
				},
				tracing: Tracing.ACTIVE,
				timeout: Duration.minutes(1),
				// bundling: {
				// 	minify: true,
				// 	sourceMap: true,
				// 	target: "node18",
				// 	externalModules: ["aws-sdk"], // Exclude AWS SDK since it's available in the Lambda runtime
				// },
			}
		);

		temp011GoochyLambda.addToRolePolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				resources: [props.tableArn],
				actions: [
					"dynamodb:PutItem",
					"dynamodb:Scan",
					"dynamodb:GetItem",
					"dynamodb:UpdateItem",
					"dynamodb:DeleteItem",
				],
			})
		);

		temp011GoochyLambda.addToRolePolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["ssm:GetParameter"],
				resources: [parameterArn],
			})
		);
		console.log("Retrieved Bucket ARN:", `${props.bucketArn}/*`);
		// Add permissions for S3 (NEW)
		temp011GoochyLambda.addToRolePolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["s3:PutObject", "s3:GetObject"],
				resources: [`${props.bucketArn}/*`],
			})
		);

		// Add permissions for Secrets Manager (NEW)
		const secret = Secret.fromSecretNameV2(
			this,
			`${props.envName}-Temp011GoochySecret`,
			`${props.envName}-Temp011GoochySecret`
		);

		// Grant the Lambda access to read the secret
		temp011GoochyLambda.addToRolePolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["secretsmanager:GetSecretValue"],
				resources: [secret.secretArn],
			})
		);

		temp011GoochyLambda.addEnvironment(
			"PARAMETER_NAME",
			`/${props.envName}/Temp011GoochyAdminPhotosBucketArn`
		);

		// Pass the secret ARN as an environment variable to the Lambda function (NEW)
		temp011GoochyLambda.addEnvironment("SECRET_ARN", secret.secretArn);

		this.temp011GoochyLambdaIntegration = new LambdaIntegration(
			temp011GoochyLambda
		);
	}
}
