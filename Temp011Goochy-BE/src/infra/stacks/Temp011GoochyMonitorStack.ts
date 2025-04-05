import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Alarm, Metric, Unit } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";
import { join } from "path";

export class Temp011GoochyMonitorStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		const webHookLambda = new NodejsFunction(this, "webHookLambda", {
			runtime: Runtime.NODEJS_18_X,
			handler: "handlerMonitor",
			entry: join(
				__dirname,
				"..",
				"..",
				"services",
				"monitor",
				"handlerMonitor.ts"
			),
		});

		const temp011GoochyAlarmTopic = new Topic(this, "Temp011GoochyAlarmTopic", {
			displayName: "Temp011GoochyAlarmTopic",
			topicName: "Temp011GoochyAlarmTopic",
		});

		//trigger the lambda function when the alarm is triggered
		temp011GoochyAlarmTopic.addSubscription(new LambdaSubscription(webHookLambda));

		const temp011GoochyApi4xxAlarm = new Alarm(this, "temp011GoochyApi4xxAlarm", {
			metric: new Metric({
				metricName: "4XXError",
				namespace: "AWS/ApiGateway",
				period: Duration.minutes(1),
				statistic: "Sum",
				unit: Unit.COUNT,
				dimensionsMap: {
					ApiName: "Temp011GoochyApi",
				},
			}),
			evaluationPeriods: 1,
			threshold: 5,
			alarmName: "Temp011GoochyApi4xxAlarm",
		});
		const topicAction = new SnsAction(temp011GoochyAlarmTopic);
		temp011GoochyApi4xxAlarm.addAlarmAction(topicAction);
		temp011GoochyApi4xxAlarm.addOkAction(topicAction);
	}
}
