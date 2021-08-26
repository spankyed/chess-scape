import { h } from 'hyperapp';

export default initial => ({
	state: { 
		menuOpen: false,
		isPromoting: false,
		resolver: null
	},
	actions: { 
		openPieceSelect: resolver => _ => ({resolver, isPromoting: true}),
		closePieceSelect: _ => _ => ({isPromoting: false}),
		toggleMenu: (ev) => (state) => ({menuOpen: !state.menuOpen}),
	},
	view: (state, actions) => ({isLoading, toggleSidePanel, gameOver}) => {
		return ( 
			// pointer-events-none controls-wrapper
			<div class={`controls-wrapper pointer-events-none ${isLoading && 'hidden'}`}>
				<div class="controls">
					{ gameOver  &&
						<MatchMessage/>
					}
					{ state.isPromoting  &&
						<PieceSelection resolver={state.resolver} closePieceSelect={actions.closePieceSelect}/>
					}
					<div class="player-section"> 
						<Player/>
						<Opponent/>
					</div>
					{/* back button */}
					<div class="btn-wrapper left">
						<button class="control-btn">
							<img src="./assets/controls/back.svg"></img>
						</button>
					</div>
					<div class="btn-wrapper right">
						{/* menu */}
						<div class="menu-wrapper">
							{ state.menuOpen && <Menu/> }
							<button onclick={actions.toggleMenu} class="control-btn first">
								<img src="./assets/controls/menu.svg"></img>
							</button>
						</div>
						{/* sidePanel button */}
						<button onclick={_=> toggleSidePanel()} class="control-btn">
							<img src="./assets/controls/sidePanel.svg"></img>
						</button>
					</div>
				</div>
			</div>
		)
	}
})
function PieceSelection({resolver, closePieceSelect}){
	let color = 'b'
	function select(piece){
		resolver(piece)
		closePieceSelect()
	}
	return (
		<div class="promotion-wrapper">
			<h2 class='w-full mx-auto text-gray-600'>Select a piece</h2>
			<div onclick={_=> select('q')} class="piece w-1/2"><img src={`./assets/controls/pieces/queen_${color}.png`}/></div>
			<div onclick={_=> select('n')} class="piece w-1/2"><img src={`./assets/controls/pieces/knight_${color}.png`}/></div>
			<div onclick={_=> select('r')} class="piece w-1/2"><img src={`./assets/controls/pieces/rook_${color}.png`}/></div>
			<div onclick={_=> select('b')} class="piece w-1/2"><img src={`./assets/controls/pieces/bishop_${color}.png`}/></div>
			{/* <div onclick={_=> select(false)} class="piece w-1/2"><img src={`./assets/controls/pieces/bishop_${color}.svg`}/></div> */}
		</div>
	)
}
function Menu(){
	return (
		// needs pointer events
		<div class="menu" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
			<div class="option" role="menu-item" id="menu-item-0" tabindex="-1">
				Resign
			</div>
			<div class="option" role="menu-item" id="menu-item-2" tabindex="-1">
				Offer Draw
			</div>
			<div class="option" role="menu-item" id="menu-item-2" tabindex="-1">
				Review Moves
			</div>
			<div onclick={_=> toggleSidePanel("media")} class="option" role="menu-item" id="menu-item-4" tabindex="-1">
				Play Media
			</div>
		</div>
	)
}
function Player(){
	let defaultSrc = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
	return (
		<div class="player left winner">
			<img class="picture" src={defaultSrc}/>  
			<div class="tagline left">
				<div class="name">John Dossssssssssssssssssssse</div>
				<div class="clock">
					<img class="icon" src="./assets/controls/clock.svg"></img>
					<span class="time">10:00</span>
				</div>
				{/* <div class="text-normal text-gray-300 hover:text-gray-400 cursor-pointer"><span class="border-b border-dashed border-gray-500 pb-1">Administrator</span></div> */}
				{/* <div class="text-sm text-gray-300 hover:text-gray-400 cursor-pointer md:absolute pt-3 md:pt-0 bottom-0 right-0">Last Seen: <b>2 days ago</b></div> */}
			</div>
		</div>
	)
}
function Opponent(){
	let defaultSrc = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
	return (
		<div class="player right">
			<div class="tagline right">
				<div class="name">Jane⚔️Doe</div>
				<div class="clock">
					<span class="time">10:00</span>
					<img class="icon" src="./assets/controls/clock.svg"></img>
				</div>
			</div>
			<img class="picture" src={defaultSrc}/>  
		</div>
	)
}
function MatchMessage(){
	return (
		<div class="message-wrapper">
			<div class='match-message'>
				<div class="messages">
					<div id="topic-1" class="message-topic">MATCH</div>
					<div id="message-1" class="message-content">
						<span>White is Victorious</span>
					</div>
				</div>
			</div>
		</div>
	)
}