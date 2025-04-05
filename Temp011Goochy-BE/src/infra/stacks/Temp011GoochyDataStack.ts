import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

interface ReplicaTableAttributes {
	tableName: string;
	tableArn: string;
	region: string;
}

interface Temp011GoochyDataStackProps extends StackProps {
	allRegions: string[];
	envName: string;
}

export class Temp011GoochyDataStack extends Stack {
	public readonly primaryTable: dynamodb.TableV2;
	public readonly deploymentBucket: IBucket;
	public readonly photosBucket: IBucket;
	public readonly replicaTables: ReplicaTableAttributes[] = [];

	// Method to get the replica table for a specific region
	public getReplicaTable(region: string): ReplicaTableAttributes | undefined {
		return this.replicaTables.find(
			(replica) => replica.region === region
		) as ReplicaTableAttributes;
	}

	constructor(
		scope: Construct,
		id: string,
		props: Temp011GoochyDataStackProps
	) {
		super(scope, id, props);

		const primaryRegion = props.env?.region;
		const replicaRegions = props.allRegions
			.filter((region) => region !== primaryRegion)
			.map((region) => ({ region, contributorInsights: false }));

		// DynamoDB Global Table with replicas in multiple regions
		this.primaryTable = new dynamodb.TableV2(
			this,
			`${props.envName}-Temp011GoochyTable`,
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
				tableName: `${props.envName}-Temp011GoochyTable`,
				replicas: replicaRegions,
			}
		);

		props.allRegions.forEach((region) => {
			const arn = `arn:aws:dynamodb:${region}:${this.account}:table/${this.primaryTable.tableName}`;
			this.replicaTables.push({
				tableName: this.primaryTable.tableName,
				tableArn: arn,
				region: region,
			});

			// Create CfnOutput for each replica table
			new CfnOutput(
				this,
				`${props.envName}-Temp011GoochyTableName-${region}`,
				{
					value: this.primaryTable.tableName,
					description: `Table name in ${region}`,
				}
			);

			new CfnOutput(
				this,
				`${props.envName}-Temp011GoochyTableArn-${region}`,
				{
					value: arn,
					description: `Table ARN in ${region}`,
				}
			);
		});
	}
}
