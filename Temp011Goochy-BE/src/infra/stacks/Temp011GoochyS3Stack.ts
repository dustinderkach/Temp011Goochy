import { Stack, StackProps, CfnOutput, PhysicalName } from "aws-cdk-lib";
import { Construct } from "constructs";
import { getSuffixFromStack } from "../Utils";
import { Bucket, HttpMethods, ObjectOwnership } from "aws-cdk-lib/aws-s3";

interface Temp011GoochyS3StackProps extends StackProps {
	envName: string;
}

export class Temp011GoochyS3Stack extends Stack {
	public readonly photosBucket: Bucket;

	constructor(
		scope: Construct,
		id: string,
		props?: Temp011GoochyS3StackProps
	) {
		super(scope, id, props);

		const suffix = getSuffixFromStack(this);

		this.photosBucket = new Bucket(this, "Temp011GoochyAdminPhotos", {
			bucketName: `${props.envName.toLowerCase()}-temp008goochy-admin-photos-${suffix}`,
			cors: [
				{
					allowedMethods: [
						HttpMethods.HEAD,
						HttpMethods.GET,
						HttpMethods.PUT,
						HttpMethods.POST,
					],
					allowedOrigins: ["*"],
					allowedHeaders: ["*"],
					exposedHeaders: ["ETag"], // Allow clients to access the ETag header
				},
			],
			objectOwnership: ObjectOwnership.OBJECT_WRITER,
			blockPublicAccess: {
				blockPublicAcls: false,
				blockPublicPolicy: false,
				ignorePublicAcls: false,
				restrictPublicBuckets: false,
			},
		});

		new CfnOutput(this, "AdminPhotosBucketName", {
			value: this.photosBucket.bucketName,
			exportName: `${props?.envName}-AdminPhotosBucketName`,
		});
	}
}
