import { App } from "aws-cdk-lib";
import { Temp011GoochyMonitorStack } from "../../src/infra/stacks/Temp011GoochyMonitorStack";
import { Capture, Match, Template } from "aws-cdk-lib/assertions";

describe("Initial test suite", () => {
	let temp011GoochyMonitorStackTemplate: Template;

	beforeAll(() => {
		const testApp = new App({
			outdir: "cdk.out",
		});

		const temp011GoochyMonitorStack = new Temp011GoochyMonitorStack(
			testApp,
			"Temp011GoochyMonitorStack"
		);
		temp011GoochyMonitorStackTemplate = Template.fromStack(
			temp011GoochyMonitorStack
		);
	});

	test("initial test", () => {
		temp011GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::Lambda::Function",
			{
				Handler: "index.handler",
				Runtime: "nodejs18.x",
			}
		);
	});

	test("Sns topic properties", () => {
		temp011GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::SNS::Topic",
			{
				DisplayName: "Temp011GoochyAlarmTopic",
				TopicName: "Temp011GoochyAlarmTopic",
			}
		);
	});

	test("Sns subscription properties - with matchers", () => {
		temp011GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::SNS::Subscription",
			Match.objectEquals({
				Protocol: "lambda",
				TopicArn: {
					Ref: Match.stringLikeRegexp("Temp011GoochyAlarmTopic"),
				},
				Endpoint: {
					"Fn::GetAtt": [
						Match.stringLikeRegexp("webHookLambda"),
						"Arn",
					],
				},
			})
		);
	});

	test("Sns subscription properties - with exact values", () => {
		const snsTopic =
			temp011GoochyMonitorStackTemplate.findResources("AWS::SNS::Topic");
		const snsTopicName = Object.keys(snsTopic)[0];

		const lambda = temp011GoochyMonitorStackTemplate.findResources(
			"AWS::Lambda::Function"
		);
		const lambdaName = Object.keys(lambda)[0];

		temp011GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::SNS::Subscription",
			{
				Protocol: "lambda",
				TopicArn: {
					Ref: snsTopicName,
				},
				Endpoint: {
					"Fn::GetAtt": [lambdaName, "Arn"],
				},
			}
		);
	});

	test("Temp011GoochyAlarm actions", () => {
		const temp011GoochyAlarmTopicActionsCapture = new Capture();

		temp011GoochyMonitorStackTemplate.hasResourceProperties(
			"AWS::CloudWatch::Alarm",
			{
				AlarmActions: temp011GoochyAlarmTopicActionsCapture,
			}
		);

		expect(temp011GoochyAlarmTopicActionsCapture.asArray()).toEqual([
			{
				Ref: expect.stringMatching(/^Temp011GoochyAlarmTopic/),
			},
		]);
	});

	test("Monitor stack snapshot", () => {
		expect(temp011GoochyMonitorStackTemplate.toJSON()).toMatchSnapshot();
	});

	test("Lambda stack snapshot", () => {
		const lambda = temp011GoochyMonitorStackTemplate.findResources(
			"AWS::Lambda::Function"
		);

		expect(lambda).toMatchSnapshot();
	});
	test("SnsTopic stack snapshot", () => {
		const snsTopic =
			temp011GoochyMonitorStackTemplate.findResources("AWS::SNS::Topic");

		expect(snsTopic).toMatchSnapshot();
	});
});
