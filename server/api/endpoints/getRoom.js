const Responses = require("../common/HTTP_Responses");
const Dynamo = require("../common/Dynamo");
const { hooksWithSchema } = require("../common/hooks");
const { sendMessage } = require("../common/websocket/message");

const roomsTable = process.env.roomsTableName;
const matchesTable = process.env.matchesTableName;

const schema = {
	body: { clientID: "string", roomID: "string" },
};

const handler = async (event) => {
	const { client, roomID } = event.body;

	const room = await Dynamo.get(roomID, roomsTable);
	const match = await Dynamo.get(roomID, matchesTable);

	// todo if private, verify user is in room, b/c chat is included in the response
	return Responses._200({ room: sanitizeRoom(room), match });
};

exports.handler = hooksWithSchema(schema, ["parse", "authorize"])(handler);
// exports.handler = hooksWithSchema(schema, ["log"])(handler);

function sanitizeRoom(room) {
	if (!room) return null;
	return {
		...room,
		gameOptions: {
			...room.gameOptions,
			pin: undefined,
		},
	};
}