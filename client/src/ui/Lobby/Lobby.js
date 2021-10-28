import { h } from 'hyperapp';
import Api from '../../api/Api';
import Create from "./create/create";
import Alert from '../Shared/Alert';
// import './lobby.scss';

const create = Create()
const alert = Alert()

export default (initial) => ({
	state: {
		create: create.state,
		alert: alert.state,
		showCreate: false,
		hostedRoom: null,
		rooms: [],
		loading: true,
		isFetching: false,
		initialized: false,
	},

	actions: {
		create: create.actions,
		alert: alert.actions,
		setLoad: (loading) => ({ loading }),
		toggleCreate: () => (state) => ({ showCreate: !state.showCreate }),
		updateRooms: (rooms) => (state, actions) => ({
			rooms: sortByCreated(rooms),
		}),
		updateRoom:
			(room) =>
			({ rooms }) => ({
				rooms: rooms.map((r) => (r.ID == room.ID ? room : r)),
			}),
		addRoom:
			({ newRoom }) =>
			({ rooms, hostedRoom }, actions) => {
				const isHost = newRoom.host == Api.getClientID();
				if (isHost) actions.alert.show(alert.hostAlert);
				return {
					rooms: sortByCreated([...rooms, newRoom]),
					hostedRoom: isHost ? newRoom.ID : hostedRoom,
				};
			},
		removeRoom:
			({ roomID }) =>
			({ rooms, hostedRoom }, { alert }) => {
				if (hostedRoom == roomID) alert.close({ id: "host" });
				let nextHostedRoom = rooms.find(
					(r) => r.host == Api.getClientID() && r.ID != roomID
				)?.ID;
				return {
					rooms: rooms.filter((r) => r.ID != roomID),
					hostedRoom: nextHostedRoom
						? nextHostedRoom
						: hostedRoom == roomID
						? null
						: hostedRoom,
				};
			},
		fetchRooms: () => (_, actions) => {
			Api.joinLobby().then(actions.completeFetch).catch(actions.exit);
			return { isFetching: true };
		},
		completeFetch:
			({ rooms }) =>
			(_, actions) => {
				const hostedRoomID = rooms.find(
					(room) => room.host == Api.getClientID()
				)?.ID;
				if (!!hostedRoomID) actions.alert.show(alert.hostAlert);
				actions.updateRooms(rooms);
				return {
					hostedRoom: hostedRoomID,
					loading: false,
					isFetching: false,
					initialized: true,
				};
			},
		exit:
			() =>
			(_, { alert }) => {
				cleanupHandlers();
				alert.closeAll();
				return { initialized: false, isFetching: false };
			},
	},

	view:
		(state, actions) =>
		({ joinRoom }) => {
			const {
				showCreate,
				hostedRoom,
				loading,
				isFetching,
				initialized,
				rooms,
			} = state;
			const CreateView = create.view(state.create, actions.create);
			const AlertView = alert.view(state.alert, actions.alert);
			window.isLoad = actions.setLoad;

			const join = (ID) => {
				joinRoom(ID);
				actions.exit();
				Api.joinRoom(ID);
			};

			const onJoin = ({ room }) => {
				if (room.host == Api.getClientID()) {
					// move user into room if room hosted by user
					join(room.ID);
				}
				actions.updateRoom(room);
			};

			const cancel = async () => {
				await Api.deleteRoom(hostedRoom).catch(actions.exit);
				actions.alert.close({ id: "host" });
			};

			const refreshRoomList = async () => {
				let { rooms } = await Api.getRooms();
				actions.updateRooms(rooms);
			};

			const initialize = async () => {
				await Api.createConnection(); // create new connection every time user visits lobby? should only connect once
				Api.setMessageHandlers({
					create: actions.addRoom,
					delete: actions.removeRoom,
					join: onJoin,
					// disconnect: Api.reconnect(), //! if hosting game, reconnect immediately
					idleReconnect: refreshRoomList, // todo refreshRoomList on all reconnects instead
				});
				actions.fetchRooms();
				// todo stop loading
			};

			if (!initialized && !isFetching) {
				console.log(`Joined lobby [${Api.getClientID()}]`);
				initialize();
			}

			return (
				<div class="lobby">
					<CreateView
						showCreate={showCreate}
						toggleCreate={actions.toggleCreate}
					/>
					<AlertView />

					<div
						class={`lobby-main ${
							Object.keys(state.alert.alerts).length &&
							"move-for-alert"
						}`}
					>
						{/* Header */}
						<div class="lobby-header">
							<h1 class="title"> Lobby </h1>
							<div>
								{!hostedRoom ? (
									<button
										onclick={actions.toggleCreate}
										disabled={!initialized || isFetching || loading}
									>
										<img src="./assets/create/add.svg"></img>
										<p class="hide-small">Create</p>
									</button>
								) : (
									<button onclick={cancel} class="cancel">
										<img src="./assets/create/cancel.svg"></img>
										<p class="hide-small"> Cancel </p>
									</button>
								)}
							</div>
						</div>
						{/* Table */}
						<div class="table-wrapper">
							{!loading && !state.rooms?.length > 0 && (
								<div class="table-empty">
									{/* if not game rooms, show some  ui */}
									<img src="./assets/lobby/empty.svg" />
									<div class="message">
										No games to play here ...
									</div>
								</div>
							)}
							<table>
								<TableHead />

								{/* Room List */}
								{loading ? (
									<LoadingTable />
								) : (
									<RoomsTable {...{ rooms, join }} />
								)}
							</table>
						</div>
					</div>
				</div>
			);
		},
});


function TableHead() {
	const headings = ["Host", "Game", "Time", "Players", "Color", "Action"];
	const hideable = ["Time", "Players", "Color"];
	const includes = (arr, item) => arr.indexOf(item) > -1;

	return (
		<thead>
			<tr>
				{headings.map((heading) => (
					<th
						scope="col"
						class={`${heading} ${
							includes(hideable, heading) && "hide-small"
						}`}
					>
						<span>{heading != "Action" && heading}</span>
					</th>
				))}
			</tr>
		</thead>
	);
}
function LoadingTable() {
	return (
		<tbody class="loading-table">
			{[...new Array(3)].map((_) => (
				<tr>
					<td class="host">
						<span class="img"></span>
						<span class="data hide-small"></span>
					</td>
					<td class="game">
						<span class="img"></span>
					</td>
					<td class="time hide-small">
						<span class="data"></span>
					</td>
					<td class="players hide-small">
						<span></span>
					</td>
					<td class="color hide-small">
						<span class="img"></span>
					</td>
					<td class="enter">
						<span></span>
					</td>
				</tr>
			))}
		</tbody>
	);
}
function RoomsTable({rooms, join}) {
	return (
		<tbody class="room-table">
			{/* {[...new Array(6)].map((room, idx) => ( */}
			{rooms.map((room, idx) => (
				// <tr class={`${idx % 2 ? '': 'bg-gray-800'} my-3 text-lg font-large`}>
				<RoomItem {...{ room, join, idx }} />
			))}
		</tbody>
	);
}

// const roomModel = {
// 	gameOptions: {
// 		name: "forever",
// 		time: { minutes: "—", increment: "—" },
// 		pin: 54,
// 		pinEnabled: true,
// 	},
// 	ID: "65",
// 	host: "94",
// 	hostName: "spankied",
// 	selectedColor: "white",
// 	players: { white: { clientID: "94" } },
// 	matchStarted: false,
// };
function RoomItem({room, join}) {
	// room = roomModel;
	const players = Object.values(room?.players||{})
	const isHost = room?.host == Api.getClientID()
	const isPlayer = isHost || players?.find((p) => p.clientID == Api.getClientID());
	const isFull = players?.length > 1
	const userImg = `https://avatars.dicebear.com/api/avataaars/${room.hostName}.svg`
	return (
		<tr class={` ${isHost && "selected-room"}`}>
			<td class="host">
				<img class="img" src={userImg} />
				<span class="hide-small">{room.hostName}</span>
			</td>
			<td class="game">
				<img
					class="opt-img"
					src={`./assets/create/types/${room.gameOptions.name}.svg`}
					alt="game type"
				/>
			</td>
			<td class="time hide-small">
				{room.gameOptions.name == "forever" ? (
					<div>
						<span class="min">
							{" "}
							{room.gameOptions.time.minutes}{" "}
						</span>
						<span> {room.gameOptions.time.increment} </span>
					</div>
				) : (
					<div>
						<span class="min">
							{room.gameOptions.time.minutes} min
						</span>
						<span>+ {room.gameOptions.time.increment} sec</span>
					</div>
				)}
			</td>
			<td class="players hide-small">
				<span class={`${isFull && "full"}`}>
					{/* <span class="hidden lg:inline">
						{`${isFull ? "Max" : "Open"}`}
					</span> */}
					{players?.length}/2
				</span>
			</td>
			<td class="color hide-small">
				<img
					class="opt-img"
					src={`./assets/create/piece-${room.selectedColor}.svg`}
				/>
			</td>
			<td class="action">
				<button
					onclick={() => join(room?.ID)}
					class={`${isHost && "host"}`}
				>
					{isHost
						? "Enter"
						: `${isPlayer || !isFull ? "Play" : "Watch"} `}
				</button>
			</td>
		</tr>
	);
}

function sortByCreated(arr) {
	return (arr || []).sort((a, b) => b.created - a.created)
}
function cleanupHandlers(){
	Api.setMessageHandlers({
		create:()=>{},
		delete:()=>{},
		join: ()=>{},
		idleReconnect: ()=>{},
	});	
}