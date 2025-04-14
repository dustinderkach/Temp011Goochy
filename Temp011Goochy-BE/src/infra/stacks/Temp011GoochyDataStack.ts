import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

interface AppTableReplicaAttributes {
	tableName: string;
	tableArn: string;
	region: string;
}

interface ConfigTableReplicaAttributes {
	tableName: string;
	tableArn: string;
	region: string;
}

interface Temp011GoochyDataStackProps extends StackProps {
	allRegions: string[];
	envName: string;
}

export class Temp011GoochyDataStack extends Stack {
	public readonly primaryAppTable: dynamodb.TableV2;
	public readonly primaryConfigTable: dynamodb.TableV2;
	public readonly deploymentBucket: IBucket;
	public readonly photosBucket: IBucket;
	public readonly AppTables: AppTableReplicaAttributes[] = [];
	public readonly ConfigTables: ConfigTableReplicaAttributes[] = [];

	constructor(
		scope: Construct,
		id: string,
		props: Temp011GoochyDataStackProps
	) {
		super(scope, id, props);

		const primaryRegion = props.env?.region;

		const replicaRegions: dynamodb.ReplicaTableProps[] = props.allRegions
			.filter((region) => region !== primaryRegion)
			.map((region) => ({ region, contributorInsights: false }));

		// Create the primary table and replicas
		this.primaryAppTable = this.createAppPrimaryAndReplicaTables(
			props.envName,
			props.allRegions,
			replicaRegions
		);

		// Create the primary table and replicas
		this.primaryConfigTable = this.createConfigPrimaryAndReplicaTables(
			props.envName,
			props.allRegions,
			replicaRegions
		);
	}

	// Method to get the replica table for a specific region
	public getAppTableByRegion(
		region: string
	): AppTableReplicaAttributes | undefined {
		return this.AppTables.find(
			(replica) => replica.region === region
		) as AppTableReplicaAttributes;
	}

	public getConfigTableByRegion(
		region: string
	): ConfigTableReplicaAttributes | undefined {
		return this.ConfigTables.find(
			(replica) => replica.region === region
		) as ConfigTableReplicaAttributes;
	}

	private createAppPrimaryAndReplicaTables(
		envName: string,
		allRegions: string[],
		replicaRegions: dynamodb.ReplicaTableProps[]
	): dynamodb.TableV2 {
		// Create the primary DynamoDB table with replicas
		const primaryTable = new dynamodb.TableV2(
			this,
			`${envName}-Temp011GoochyTable`,
			{
				partitionKey: {
					name: "id",
					type: dynamodb.AttributeType.STRING,
				},
				billing: dynamodb.Billing.onDemand(),
				contributorInsights: true,
				pointInTimeRecovery: true,
				tableClass: dynamodb.TableClass.STANDARD,
				removalPolicy: RemovalPolicy.DESTROY,
				tableName: `${envName}-Temp011GoochyTable`,
				replicas: replicaRegions,
			}
		);

		// Add replicas to the replicaAppTables array and create outputs
		allRegions.forEach((region) => {
			const arn = `arn:aws:dynamodb:${region}:${this.account}:table/${primaryTable.tableName}`;
			this.AppTables.push({
				tableName: primaryTable.tableName,
				tableArn: arn,
				region: region,
			});

			// Create CfnOutput for each replica table
			new CfnOutput(this, `${envName}-Temp011GoochyTableName-${region}`, {
				value: primaryTable.tableName,
				description: `Table name in ${region}`,
			});

			new CfnOutput(this, `${envName}-Temp011GoochyTableArn-${region}`, {
				value: arn,
				description: `Table ARN in ${region}`,
			});
		});

		return primaryTable;
	}

	private createConfigPrimaryAndReplicaTables(
		envName: string,
		allRegions: string[],
		replicaRegions: dynamodb.ReplicaTableProps[]
	): dynamodb.TableV2 {
		// Create the primary DynamoDB table with replicas
		const primaryTable = new dynamodb.TableV2(
			this,
			`${envName}-Temp011GoochyCongfigTable`,
			{
				partitionKey: {
					name: "id",
					type: dynamodb.AttributeType.STRING,
				},
				billing: dynamodb.Billing.onDemand(),
				contributorInsights: true,
				pointInTimeRecovery: true,
				tableClass: dynamodb.TableClass.STANDARD,
				removalPolicy: RemovalPolicy.DESTROY,
				tableName: `${envName}-Temp011GoochyCongfigTable`,
				replicas: replicaRegions,
			}
		);

		// Add replicas to the replicaAppTables array and create outputs
		allRegions.forEach((region) => {
			const arn = `arn:aws:dynamodb:${region}:${this.account}:table/${primaryTable.tableName}`;
			this.ConfigTables.push({
				tableName: primaryTable.tableName,
				tableArn: arn,
				region: region,
			});

			// Create CfnOutput for each replica table
			new CfnOutput(this, `${envName}-Temp011GoochyCongigTableName-${region}`, {
				value: primaryTable.tableName,
				description: `Table name in ${region}`,
			});

			new CfnOutput(this, `${envName}-Temp011GoochyCongigTableArn-${region}`, {
				value: arn,
				description: `Table ARN in ${region}`,
			});
		});

		return primaryTable;
	}
}
