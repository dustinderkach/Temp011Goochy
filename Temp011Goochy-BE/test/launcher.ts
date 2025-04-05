import { handlerTemp011Goochy } from "../src/services/temp011Goochy/handlerTemp011Goochy";

process.env.AWS_REGION = "us-east-1";
process.env.TABLE_NAME = "Temp011GoochyTable-020fda1d7783";

handlerTemp011Goochy(
	{
		httpMethod: "PUT",
		queryStringParameters: {
			id: "fbe76aea-5aff-434e-85f6-e8f5fc1647ec",
		},
		body: JSON.stringify({
			location: "Best location 2",
		}),
	} as any,
	{} as any
).then((result) => {
	console.log(result);
});
