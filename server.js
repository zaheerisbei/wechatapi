import express from "express";
import { decrypt, getSignature } from '@wecom/crypto';
import bodyParser from "body-parser";
var xmlparser = require('express-xml-bodyparser');

const app = express();

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(xmlparser());
app.use(express.static("public"));

app.get("/", async (req, res) => {
	console.log(req.query);
	const { msg_signature, timestamp, nonce, echostr } = req.query;
	let weToken = 'fdAhCoBdeB1sRdDh4sqorXD7';
	// try {
	// 	const apiResponse = await fetch(
	// 		'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=wweb89d875de036888&corpsecret=vnVJ01v1uvdPvzoxhi1Ya82KDC4xut6jH9xn_LmU848'
	// 	);
	// 	const apiResponseJson = await apiResponse.json()
	// 	weToken = apiResponseJson.access_token;
	// } catch (err) {
	// 	console.log(err)
	// 	res.status(500).send('Something went wrong')
	// }

	const devSign = getSignature(weToken, timestamp, nonce, echostr);
	console.log("Dev Singature ", devSign);

	if (devSign === msg_signature) {
		console.log("User is Authorized")
		const encodingAESKey = 'ecFa4cslc2lNetLEUjbH7DcPi8PV9JfaB1xu1IELBTR';
		// const encodeee = encrypt(encodingAESKey, 'teststring', '123')
		// console.log('Encoded String: ', encodeee)
		const { message, id } = decrypt(encodingAESKey, echostr);

		console.log({ message, id });
		res.status(200).send(message);
	} else {
		console.log("Unauthorized user")
		res.status(403).send("Unauthorized user");
	};
})

// Posting a new employee
app.post("/", async (req, res) => {
	console.log('Event Received', req.query);
	console.log('Parsed XML: ' + JSON.stringify(req.body));
	const { msg_signature, timestamp, nonce, echostr } = req.query;
	let weToken = 'fdAhCoBdeB1sRdDh4sqorXD7';
	// try {
	// 	const apiResponse = await fetch(
	// 		'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=wweb89d875de036888&corpsecret=vnVJ01v1uvdPvzoxhi1Ya82KDC4xut6jH9xn_LmU848'
	// 	);
	// 	const apiResponseJson = await apiResponse.json()
	// 	weToken = apiResponseJson.access_token;
	// } catch (err) {
	// 	console.log(err)
	// 	res.status(500).send('Something went wrong')
	// }

	const devSign = getSignature(weToken, timestamp, nonce, echostr);
	console.log("Dev Singature ", devSign);

	if (devSign === msg_signature) {
		console.log("User is Authorized")
		const encodingAESKey = 'ecFa4cslc2lNetLEUjbH7DcPi8PV9JfaB1xu1IELBTR';
		// const encodeee = encrypt(encodingAESKey, 'teststring', '123')
		// console.log('Encoded String: ', encodeee)
		const message = decrypt(encodingAESKey, echostr);

		console.log(message);
		res.status(200)
	} else {
		console.log("Unauthorized user")
	};
})

app.listen(process.env.PORT || 3000, function () {
	console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

