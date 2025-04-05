import { App } from "aws-cdk-lib";
import { Temp011GoochyApiStack } from "./stacks/Temp011GoochyApiStack";
import { Temp011GoochyDataStack } from "./stacks/Temp011GoochyDataStack";
import { Temp011GoochyLambdaStack } from "./stacks/Temp011GoochyLambdaStack";
import { Temp011GoochyAuthStack } from "./stacks/Temp011GoochyAuthStack";
import { Temp011GoochyUiDeploymentStack } from "./stacks/Temp011GoochyUiDeploymentStack";
import { Temp011GoochyMonitorStack } from "./stacks/Temp011GoochyMonitorStack";
import { Temp011GoochyS3Stack } from "./stacks/Temp011GoochyS3Stack";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

const app = new App();

// Get environment from CDK cli context, default to DEV, e.g., cdk deploy -c env=UAT or cdk deploy --context env=UAT
const envName = app.node.tryGetContext("env") || "DEV";
// Get environments from CDK context (cdk.json)
const environments = app.node.tryGetContext("environments");

if (!environments[envName]) {
	throw new Error(`Environment "${envName}" not found in environments list.`);
}

const env = environments[envName];

console.log(
	`🚀 Deploying to environment: ${envName} (Account: ${env.account}, Region: ${env.primaryRegion})`
);

// Note: A new region will need to be bootstrapped in the CDK CLI before deploying to a new region
// Bootstrapped: US East (N. Virginia) - us-east-1, EU (Frankfurt) - eu-central-1, Asia Pacific (Singapore) - ap-southeast-1
// e.g., cdk bootstrap aws://094106269614/eu-central-1
const allRegions = [env.primaryRegion, "eu-central-1"];

// Create a global S3 stack, in one region as it's CDN and global.
const s3Stack = new Temp011GoochyS3Stack(
	app,
	`${envName}-Temp011GoochyS3Stack`,
	{
		env: { account: env.account, region: env.primaryRegion },
		envName: envName,
	}
);

// Deploy Auth stack only in a single region (global authentication).
const authStack = new Temp011GoochyAuthStack(
	app,
	`${envName}-Temp011GoochyAuthStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
		photosBucket: s3Stack.photosBucket,
		envName: envName,
	}
);

//  For Deploy/Destroy purposes add dependency: Auth stack depends on S3 stack
authStack.addDependency(s3Stack);

const dataStack = new Temp011GoochyDataStack(
	app,
	`${envName}-Temp011GoochyDataStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
		allRegions: allRegions,
		envName: envName,
	}
);

//  For Deploy/Destroy purposes add dependency: Data stack depends on Auth stack
dataStack.addDependency(authStack);

allRegions.forEach((region) => {
	const replicaTable = dataStack.getReplicaTable(region);

	if (replicaTable) {
		let regionName = region;
		if (region === env.primaryRegion) {
			regionName = "PrimaryRegion";
		}



		let lambdaStack = new Temp011GoochyLambdaStack(
			app,
			`${envName}-Temp011GoochyLambdaStack-${regionName}`,
			{
				env: { account: env.account, region }, // Add this line
				tableArn: replicaTable.tableArn,
				crossRegionReferences: true,
				tableName: replicaTable.tableName,
				envName: envName,
				bucketName: s3Stack.photosBucket.bucketName,
				bucketArn: s3Stack.photosBucket.bucketArn,
			}
		);

		// For Deploy/Destroy purposes add dependency: Lambda stack depends on Data stack
		lambdaStack.addDependency(dataStack);

		let apiStack = new Temp011GoochyApiStack(
			app,
			`${envName}-Temp011GoochyApiStack${regionName}`,
			{
				env: { account: env.account, region },
				crossRegionReferences: true,
				temp011GoochyLambdaIntegration:
					lambdaStack.temp011GoochyLambdaIntegration,
				userPool: authStack.userPool, // Use global user pool
				envName: envName,
			}
		);

		// For Deploy/Destroy purposes add dependency: Lambda stack depends on Data stack
		apiStack.addDependency(lambdaStack);
	}
});

// (Optional) Deploy the UI & monitor stacks in one region
const uiDeploymentStack = new Temp011GoochyUiDeploymentStack(
	app,
	`${envName}-Temp011GoochyUiDeploymentStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
		envName: envName,
	}
);

//  For Deploy/Destroy purposes add dependency: UI Deployment stack depends on Auth stack
uiDeploymentStack.addDependency(authStack);

const monitorStack = new Temp011GoochyMonitorStack(
	app,
	`${envName}-Temp011GoochyMonitorStack`,
	{
		env: { account: env.account, region: env.primaryRegion },
	}
);

//  For Deploy/Destroy purposes add dependency: dMonitor stack depends on Data stack
monitorStack.addDependency(dataStack);
