const Responses = require("../../common/HTTP_Responses");
const Dynamo = require("../../common/Dynamo");
const { sendMessageToLobby, sendMessageToRoom } = require("../../common/websocket/message");

const clientsTable = process.env.clientsTableName;
const matchesTable = process.env.matchesTableName;
const roomsTable = process.env.roomsTableName;

module.exports = async function (
	{ clientID, roomID },
	client,
	connection,
	pinValidated
) {
	try {
		const [room, match] = await Promise.all([
			Dynamo.get(roomID, roomsTable),
			Dynamo.get(roomID, matchesTable)
		]);

		if (!room) {
			// todo force client back to lobby
			return Responses._400({ error: "Room not found" });
		}

		const isAdmin = clientID === "angel";
		const isHost = room.host === clientID;

		if (room.gameOptions.pin && !pinValidated && !isHost && !isAdmin) {
			return Responses._400({ error: "Room is private" });
		}

		Dynamo.update({
			TableName: clientsTable,
			primaryKey: "ID",
			primaryKeyValue: clientID,
			updates: { room: roomID },
		});

		const [group, updatedRoom] = await updateRoom(room, client);

		const { lastMove, moves, ...matchData } = match;
		
		const message = {
			method: "join",
			room: sanitizeRoom(updatedRoom),
			match: matchData,
			group,
			username: client.username,
		};

		const messageRecipients = [
			sendMessageToRoom(roomID, message),
			// only message lobby if player joined, not spectator
			...(group == "players" ? [sendMessageToLobby(message)] : []),
		];

		console.log(`[${group}] Joined room[${roomID}] client[${clientID}]`);

		Promise.all(messageRecipients);
	} catch (err) {
		console.error(err);
		return Responses._400({ error: err.message });
	}

	return Responses._200({});
};


async function updateRoom(room, client){
	const { ID: clientID, username } = client;
	const isHost = room.host == clientID;
	const isAngel = clientID == "angel";
	const isVsAngel = room.gameOptions.selectedOpp == "angel";
	const eligiblePlayer = !isVsAngel || isAngel;
	const playerColors = Object.keys(room.players);
	const group = playerColors.length < 2 ? "players" : "spectators";
	const alreadyPlayer = Object.values(room.players).some(
		(p) => p.clientID == clientID
	);
	
	if (isHost || alreadyPlayer) {
		return ["players", room];
	} else if (group === "players" && eligiblePlayer) {
		const joinedColor = playerColors[0] == "white" ? "black" : "white";
		const [{ Attributes: updatedRoom }] = await Promise.all([
			Dynamo.update({
				TableName: roomsTable,
				primaryKey: "ID",
				primaryKeyValue: room.ID,
				updates: {
					[`players.${joinedColor}`]: {
						clientID,
						username,
					},
				},
			}),
			Dynamo.update({
				TableName: matchesTable,
				primaryKey: "ID",
				primaryKeyValue: room.ID,
				updates: {
					[`players.${joinedColor}`]: {
						clientID,
						ready: false,
						committed: false,
					},
				},
			}),
		]);
		return [group, updatedRoom];
	} else {
		const { Attributes: updatedRoom } = await Dynamo.update({
			TableName: roomsTable,
			primaryKey: "ID",
			primaryKeyValue: room.ID,
			updates: {
				[`spectators.${clientID}`]: { clientID, watching: true },
			},
		});
		return [group, updatedRoom];
	}
}

function sanitizeRoom(room) {
	if (!room) return null;
	return {
		...room,
		chat: undefined,
		gameOptions: {
			...room.gameOptions,
			pin: !!room.gameOptions.pin,
		},
	};
}