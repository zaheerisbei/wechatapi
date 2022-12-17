import express from "express";
import { decrypt, getSignature } from '@wecom/crypto';
import bodyParser from "body-parser";
import xmlparser from 'express-xml-bodyparser';
import xmlParser from 'xml2json';
import axios from 'axios';
import NodeCache from "node-cache";
import fetch from "node-fetch";

const cache = new NodeCache({ stdTTL: 60 }); // cache items for 60 

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
		res.status(401).send("Unauthorized user");
	};
})

app.get('/test', (req, res) => {
	const message = {
		message: '<xml><ToUserName><![CDATA[wweb89d875de036888]]></ToUserName><CreateTime>1671216718</CreateTime><MsgType><![CDATA[event]]></MsgType><Event><![CDATA[kf_msg_or_event]]></Event><Token><![CDATA[ENCFMjVBy8fXBi5t6rR6bZfyYWw9oXwHx7ck8E4RkeU2MDP]]></Token><OpenKfId><![CDATA[wkA816UQAANyEz3O8fUwfiGQelx4VF_w]]></OpenKfId></xml>'
	}
	const jsonMsg = JSON.parse(xmlParser.toJson(`${message.message}`));
	console.log('JSON msg', jsonMsg.xml.OpenKfId);

	res.status(200)
})

// Posting a new employee
app.post("/", async (req, res) => {
	console.log('Event Received', req.query);
	// console.log('Raw XML: ', req.body.xml.encrypt[0]);
	// console.log('Parsed XML: ' + JSON.stringify(req.body));
	// console.log('JSON output', xmlParser.toJson(`${req.body}`));
	if (isAuthorized(req)) {
		const encodingAESKey = 'ecFa4cslc2lNetLEUjbH7DcPi8PV9JfaB1xu1IELBTR';
		const echostr = req.body.xml.encrypt[0];
		const message = decrypt(encodingAESKey, echostr);
		const jsonMsg = JSON.parse(xmlParser.toJson(`${message.message}`));

		// console.log(message);
		let accessToken = cache.get("access_token");
		if (!accessToken) {
			// if the access token is not in the cache, fetch a new one
			console.log("Fetching new token");
			accessToken = await fetchAccessToken();
			cache.set("access_token", accessToken);
		}

		console.log("OPEN_KFID", jsonMsg.xml.OpenKfId);
		console.log("Cursor: ", res.get("cursor"))

		try {
			const response = await axios.post(`https://qyapi.weixin.qq.com/cgi-bin/kf/sync_msg?access_token=${accessToken}`, {
				"open_kfid": jsonMsg.xml.OpenKfId,
				"cursor": res.get("cursor")
			});
			if(response.data.next_cursor  === res.get("cursor")) {
				res.status(200)
				return;
			}
			console.log("Result", response.data);
			console.log("Cursor Value: ", response.data.next_cursor)
			cache.set("cursor", response.data.next_cursor)
			res.status(200);
		} catch (err) {
			console.log("Error", err);
			res.status(400);
		}
	} else {
		res.status(401).send('Unauthorised User')
	};
})

const isAuthorized = (req) => {
	const { msg_signature, timestamp, nonce } = req.query;
	const echostr = req.body.xml.encrypt[0];
	let weToken = 'fdAhCoBdeB1sRdDh4sqorXD7';

	const devSign = getSignature(weToken, timestamp, nonce, echostr);

	if (devSign === msg_signature) {
		return true;
	} else {
		return false
	}
}

const fetchAccessToken = async () => {
	try {
		const apiResponse = await fetch(
			'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=wweb89d875de036888&corpsecret=vnVJ01v1uvdPvzoxhi1Ya82KDC4xut6jH9xn_LmU848'
		);
		const apiResponseJson = await apiResponse.json()
		return apiResponseJson.access_token;
	} catch (err) {
		console.log(err)
		res.status(500).send('Something went wrong')
	}
}

app.listen(process.env.PORT || 3000, function () {
	console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

