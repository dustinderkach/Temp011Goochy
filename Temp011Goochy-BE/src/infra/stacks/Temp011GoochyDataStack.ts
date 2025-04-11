import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

interface ReplicaAppTableAttributes {
	tableName: string;
	tableArn: string;
	region: string;
}

interface ReplicaConfigTableAttributes {
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
	public readonly deploymentBucket: IBucket;
	public readonly photosBucket: IBucket;
	public readonly replicaAppTables: ReplicaAppTableAttributes[] = [];

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
		this.primaryAppTable = this.createPrimaryTableWithReplicas(
			props.envName,
			props.allRegions,
			replicaRegions
		);
	}

	// Method to get the replica table for a specific region
	public getAppReplicaTable(
		region: string
	): ReplicaAppTableAttributes | undefined {
		return this.replicaAppTables.find(
			(replica) => replica.region === region
		) as ReplicaAppTableAttributes;
	}

	private createPrimaryTableWithReplicas(
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
			this.replicaAppTables.push({
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
}
