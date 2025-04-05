import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
	AuthorizationType,
	CognitoUserPoolsAuthorizer,
	Cors,
	LambdaIntegration,
	MethodOptions,
	ResourceOptions,
	RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

interface Temp011GoochyApiStackProps extends StackProps {
	temp011GoochyLambdaIntegration: LambdaIntegration;
	userPool: IUserPool;
	env: { account: string; region: string };
	envName: string;
}

export class Temp011GoochyApiStack extends Stack {
	constructor(
		scope: Construct,
		id: string,
		props: Temp011GoochyApiStackProps
	) {
		super(scope, id, props);

		const api = new RestApi(this, `${props.envName}-Temp011GoochyApi`, {
			defaultCorsPreflightOptions: {
				allowOrigins: Cors.ALL_ORIGINS,
				allowMethods: Cors.ALL_METHODS,
			},
		});

		const authorizer = new CognitoUserPoolsAuthorizer(
			this,
			`${props.envName}-Temp011GoochyApiAuthorizer`,
			{
				cognitoUserPools: [props.userPool],
				identitySource: "method.request.header.Authorization",
			}
		);

		const optionsWithAuth: MethodOptions = {
			authorizationType: AuthorizationType.COGNITO,
			authorizer: authorizer, // updated, _attachToApi no longer required
		};

		const temp011GoochyResource = api.root.addResource(
			`${props.envName}-temp011Goochy`
		);
		temp011GoochyResource.addMethod(
			"GET",
			props.temp011GoochyLambdaIntegration,
			optionsWithAuth
		);
		temp011GoochyResource.addMethod(
			"POST",
			props.temp011GoochyLambdaIntegration,
			optionsWithAuth
		);
		temp011GoochyResource.addMethod(
			"PUT",
			props.temp011GoochyLambdaIntegration,
			optionsWithAuth
		);
		temp011GoochyResource.addMethod(
			"DELETE",
			props.temp011GoochyLambdaIntegration,
			optionsWithAuth
		);

		const apiEndpoint = `${api.url}${props.envName}-temp011Goochy`;
		new CfnOutput(this, `${props.envName}-Temp011GoochyApiEndpoint`, {
			value: apiEndpoint,
			description: "The endpoint of the Temp011Goochy API",
			exportName: `${props.envName}-Temp011GoochyApiEndpoint`,
		});
	}
}
