import { h } from 'hyperapp';
import Music from './music/music'; 
import Video from './video/video'; 

const music = Music()
const video = Video()

export default initial => ({
	state: { 
		music: music.state,
		video: video.state,
		currMoveIdx: 0,
		mediaOpen: 'music'
	},
	actions: { 
		music: music.actions,
		video: video.actions,
		showMedia: (type, force) => (state) => ({mediaOpen: force ? type : (state.mediaOpen == type ? '' : type)}),
	},
	view: (state, {showMedia,...actions}) => ({alert}) => {
		const MusicView = music.view(state.music, actions.music)
		const VideoView = video.view(state.video, actions.video)

		function isOpen(type){ return state.mediaOpen == type }
		return (
			<div class="media">
				<div class="media-toggles">
					<button
						class={`${isOpen("music") && "active"} toggle`}
						onclick={(_) => showMedia("music")}
					>
						<h2>
							<span>Play</span> Music
						</h2>
					</button>
					<button
						class={`${isOpen("video") && "active"} toggle`}
						onclick={(_) => showMedia("video")}
					>
						<h2>
							<span>Play</span> Video
						</h2>
					</button>
				</div>

				{isOpen("music") ? (
					<MusicView alert={alert} mediaOpen={state.mediaOpen} />
				) : (
					<VideoView alert={alert} mediaOpen={state.mediaOpen} />
				)}
			</div>
		);
	}
})

