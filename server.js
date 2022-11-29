import express from "express";
import { decrypt, getSignature } from '@wecom/crypto';
import bodyParser from "body-parser";
import fetch from 'node-fetch';

const app = express();

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", async (req, res) => {
	console.log(req.query);
	const { msg_signature, timestamp, nonce, echostr } = req.query;
	let weToken;
	try {
		const apiResponse = await fetch(
			'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=wweb89d875de036888&corpsecret=vnVJ01v1uvdPvzoxhi1Ya82KDC4xut6jH9xn_LmU848'
		);
		const apiResponseJson = await apiResponse.json()
		weToken = apiResponseJson.access_token;
	} catch (err) {
		console.log(err)
		res.status(500).send('Something went wrong')
	}

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
	};
})

// Posting a new employee
app.post("", async (req, res) => {
	console.log(req.query);
	const { msg_signature, timestamp, nonce, echostr } = req.query;
	let weToken;
	try {
		const apiResponse = await fetch(
			'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=wweb89d875de036888&corpsecret=vnVJ01v1uvdPvzoxhi1Ya82KDC4xut6jH9xn_LmU848'
		);
		const apiResponseJson = await apiResponse.json()
		weToken = apiResponseJson.access_token;
	} catch (err) {
		console.log(err)
		res.status(500).send('Something went wrong')
	}

	const devSign = getSignature(weToken, timestamp, nonce, echostr);
	console.log("Dev Singature ", devSign);

	if (devSign === msg_signature) {
		console.log("User is Authorized")
		const encodingAESKey = 'ecFa4cslc2lNetLEUjbH7DcPi8PV9JfaB1xu1IELBTR';
		// const encodeee = encrypt(encodingAESKey, 'teststring', '123')
		// console.log('Encoded String: ', encodeee)
		const { message, id } = decrypt(encodingAESKey, echostr);

		console.log({ message, id });
		res.status(200)
	} else {
		console.log("Unauthorized user")
	};
})

app.listen(3000, function () {
	console.log("Server started on port 3000");
});

