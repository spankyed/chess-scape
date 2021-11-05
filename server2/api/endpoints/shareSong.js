const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const S3 = require("../common/S3");
const { hooksWithSchema } = require("../common/hooks");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdef", 20);
const parser = require("lambda-multipart-parser");
const fileType = require("file-type");
const { authorize } = require("../common/authorize");
const {
	// sendMessageToRoom,
	sendMessageToRoomExcept,
} = require("../common/websocket/message");

const bucket = process.env.bucketName;
const mediaTable = process.env.mediaTableName;

const schema = {
	// body: { clientID: "string", roomID: "string" },
};

/** 
 * Songs are uploaded to S3 bucket and 
 * room clients can access the audio with a 
 * file location URL returned from S3 bucket upload.
 * ! Files must be removed from bucket when room deleted
 */
handler = async (event) => {
	try {
		const body = await parser.parse(event);
		const { clientID, roomID, TOKEN, ...form } = body;
		const file = form.files[0];
		const { files, ...songInfo } = form

		const [isAuthorized, client] = await authorize(clientID, TOKEN);
		
		if (!isAuthorized) {
			return Responses._401({ message: "Unauthorized connection" });
		}

		const bufferValid = await isValidFileType(file.content);

		if (file.contentType != "audio/mpeg" || !bufferValid) {
			return Responses._400({ message: "Invaid file type" });
		};

		const uuid = nanoid();

		const s3Data = await S3.upload(file, uuid, bucket);

		if (!s3Data) {
			return Responses._400({ message: "Failed to persist file to S3" });
		}

		const song = {
			...songInfo,
			ID: uuid,
			created: Date.now(),
			fileName: file.filename,
			src: s3Data.Location,
		};

		Promise.all([
			sendMessageToRoomExcept(roomID, clientID, {
				method: "share",
				type: "music",
				song,
			}),
			Dynamo.write(song, mediaTable),
		]);
		
		return Responses._200({ song });
	} catch (err) {
		console.error(err);
		return Responses._400({ error: err.message });
	}
};

exports.handler = hooksWithSchema(schema, [])(handler);

async function isValidFileType(buffer) {
	let { mime } = await fileType.fromBuffer(buffer);
	return mime.indexOf("audio") > -1;
}