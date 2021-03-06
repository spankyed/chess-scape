import { h } from 'hyperapp';
import Game from './game.js';
import Loader from './loader/loader'; 
import Controls from './controls/Controls'; 
import SidePanel from './sidePanel/sidePanel'; 
import Alert from '../Shared/Alert';
import Api from "../../api/Api";

const game = Game();
const controls = Controls()
const sidePanel = SidePanel()
const alert = Alert()
const loader = Loader();

// todo: alert users & handle reconnect if player disconnects in game,  
// todo: when user leaves game remove clientID from game.clients 

const initialState = {
	room: null,
	game: game.state,
	alert: alert.state,
	loader: loader.state,
	controls: controls.state,
	sidePanel: sidePanel.state,
	sidePanelOpen: false,
	isHost: false,
	isFetching: false,
	initialized: false,
	// matchStarted: false,
	gameOver: false,
	matchInfo: null,
	closed: false,
};

export default (initial) => ({
	state: initialState,
	actions: {
		game: game.actions,
		controls: controls.actions,
		sidePanel: sidePanel.actions,
		alert: alert.actions,
		loader: loader.actions,
		setLoaderText: (text) => ({ loaderText: text }),
		updateRoom: (room) => () => ({ room }),
		fetchRoom: (roomID) => (_, actions) => {
			Api.getRoom(roomID).then(actions.completeFetch);
			return { isFetching: true };
		},
		completeFetch:
			({ room, match } = {}) =>
			(_, actions) => {
				if (!room || !match)
					// todo go back to lobby
					return { isFetching: false, initialized: true };
				const isHost = room.host == Api.getClientID();
				const players = Object.entries(room.players);
				const [color, player] =
					players.find((p) => p[1].clientID == Api.getClientID()) ||
					[];
				if (!match.matchStarted) {
					if (players.length == 1) {
						const isVsAngel = room?.gameOptions.selectedOpp == "angel";
						isHost && actions.alert.show(alert.hostAlert(isVsAngel));
					} else {
						actions.alert.show(alert.startAlert);
					}
				}
				// if matchStarted server will auto send message to sync client when fetching room

				if (match.finished) {
					actions.endGame(match);
				}

				const setup = player && {
					players: room.players,
					player,
					playerColor: color,
					committed: match.players[color]?.committed,
					matchStarted: match.matchStarted,
					colorToMove: match.colorToMove,
				};
				
				actions.controls.setPlayers(room.players);

				actions.game.setInfo({
					info: setup,
					isSceneSetup: _.loader.removed,
				});

				if (match.moves.length > 0) {
					actions.game.syncBoard({ board: match, roomActions: actions });
				}

				return {
					room,
					isHost,
					gameOver: !!match.finished,
					isFetching: false,
					initialized: true,
				};
			},
		restartGame: () => () => ({ gameOver: false, matchInfo: null }),
		endGame:
			({ winningColor, endMethod, mated }) =>
			() => ({
				gameOver: true,
				matchInfo: { winningColor, endMethod, mated },
			}),
		close: () => () => ({ closed: true }),
		exit:
			() =>
			(_, { alert }) => {
				document.body.style.cursor = "default";
				cleanupHandlers();
				alert.closeAll();
				// ! todo update DB client.room to 'lobby' otherwise wont receive join msgs
				// ^ should happen when user enters lobby
				return initialState;
			},
	},
	view:
		(state, actions) =>
		({ roomID, joinLobby }) => {
			const GameView = game.view(state.game, actions.game);
			const ControlsView = controls.view(
				state.controls,
				actions.controls
			);
			const SidePanelView = sidePanel.view(
				state.sidePanel,
				actions.sidePanel
			);
			const AlertView = alert.view(state.alert, actions.alert);
			const LoaderView = loader.view(state.loader, actions.loader);

			const onJoin = ({ room, match, group, username }) => {
				const getLength = (obj) => Object.keys(obj).length;
				if (group == "players") {
					if (getLength(room.players) == 2 &&
						!match?.matchStarted
					) {
						actions.alert.close({ id: "host" });
						actions.alert.show(alert.startAlert); // alert match is starting soon
					}
					if (getLength(state.controls.players) != 2) {
						actions.controls.setPlayers(room.players);
					}
				}

				actions.updateRoom(room);

				if (username) actions.sidePanel.chat.addMessage({
					text: `${username} has joined the room`,
					appMsg: true,
				});
			};

			const onDisband = ({ clientID }) => {
				// todo post in chat that room has been closed
				actions.alert.show(DisbandedAlert(leave));
				actions.close();
			};

			const initialize = async () => {
				// todo: on total disconnect, breakdown websocket and game
				Api.setMessageHandlers({
					disband: onDisband,
					join: onJoin,
					// disconnect: state.game.player && Api.reconnect, // if a player reconnect immediately
					idleReconnect: Api.sync,
					reconnect: Api.sync,
				});
				actions.fetchRoom(roomID);
			};

			if (!state.loader.isLoading && !state.initialized && !state.isFetching) {
				console.log(`Joined room [${Api.getClientID()}]`);
				initialize();
			}

			const leave = () => {
				Api.leaveRoom(roomID);
				actions.exit();
				joinLobby();
			};

			return (
				<div class="game-room">
					{/* { !state.loader.removed && */}
					<LoaderView alert={actions.alert} />
					{/* } */}
					<div class="game-area">
						<ControlsView
							roomID={roomID}
							leaveRoom={leave}
							roomState={state}
							toggleSidePanel={actions.sidePanel.toggleSidePanel}
							alert={actions.alert}
						/>
						<GameView
							{...{
								roomID,
								roomActions: actions,
								roomState: state,
							}}
						/>
						{state.loader.removed
						 && <AlertView />
						}
					</div>

					<SidePanelView
						roomID={roomID}
						loaderRemoved={state.loader.removed}
						alert={actions.alert}
					/>
				</div>
			);
		},
});

function DisbandedAlert(leave) {
	return {
		// icon: "./assets/lobby/create/host.svg",
		id: "disband",
		role: "none",
		heading: "Room Disbanded",
		message: "This room no longer exists.",
		actions: {
			default: {
				text: "Leave",
				handler: (_) => {
					leave();
				},
			},
		},
	};
}

function cleanupHandlers(){
	Api.setMessageHandlers({
		chat: () => {},
		join: () => {},
		leave: () => {},
		disband: () => {},
		sync: () => {},
		start: () => {},
		rematch: () => {},
		offer: () => {},
		move: () => {},
		end: () => {},
		disconnect: () => {},
		idleReconnect: () => {},
		reconnect: () => {},
	});	
	// Api.stopPinging();
}