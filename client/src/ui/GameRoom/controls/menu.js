import { h } from 'hyperapp';
import prompts from './prompts.js';
import Api from "../../../api/Api"; 
import * as nano from "nanodelay";
import { fromEvent, mergeMap, of } from "rxjs";
import { filter, delay, takeUntil } from "rxjs/operators";
import Scene from "../../../core/Scene";

export default (initial) => ({
	state: {
		menuOpen: false,
		recentlyOffered: false,
		initialized: false,
	},
	actions: {
		toggleMenu: (val) => (state) => ({
			menuOpen: "boolean" === typeof val ? val : !state.menuOpen,
		}),
		disableOffers: () => ({ recentlyOffered: true }),
		enableOffers: () => ({ recentlyOffered: false }),
		initialize: () => ({ initialized: true }),
	},
	view:
		(
			{ recentlyOffered, menuOpen, initialized },
			{ toggleMenu, disableOffers, enableOffers, initialize }
		) =>
		({ alert, roomState, toggleSidePanel, flipCamera, isSpectator }) => {
			const { gameOver, game, closed: roomClosed } = roomState;

			const openPanel = (tab) => () => {
				toggleMenu();
				toggleSidePanel({ tab, isOpen: true });
			};

			const prompt = (method) => () => {
				toggleMenu();
				alert.show(prompts[method]);
			};

			const offer = (type) => () => {
				disableOffers();
				alert.close({ id: type, completed: true }); // close any duplicate offer
				Api.offer(type);
				nano.delay(7000).then(enableOffers);
			};

			const handleOutsideClick = (el) => {
				const documentClick$ = fromEvent(document, "click");
				documentClick$
					.pipe(
						filter((ev) => !el.children[0].isEqualNode(ev.target))
					)
					.subscribe(() => toggleMenu(false));
			};

			const handleHover = (el) => {
				const enter$ = fromEvent(el, "mouseenter");
				const leave$ = fromEvent(el, "mouseleave");
				leave$
					.pipe(
						mergeMap((ev) =>
							of(ev).pipe(delay(300), takeUntil(enter$))
						)
					)
					.subscribe((_) => toggleMenu(false));
				// enter$.subscribe((_) => toggleMenu(true));
			};

			const oncreate = (el) => {
				if (!initialized) {
					initialize();
					handleHover(el);
					handleOutsideClick(el);
				}
			};

			return (
				<div oncreate={oncreate} class="menu-wrapper">
					{menuOpen && (
						<div
							class="menu"
							role="menu"
							aria-orientation="vertical"
							aria-labelledby="menu-button"
							tabindex="-1"
						>
							{!gameOver && game.committed && game.player && (
								<div
									onclick={prompt("resign")}
									class="menu-item"
									role="menu-item"
									id="menu-item-0"
									tabindex="-1"
								>
									<div class="menu-icon">
										<img src="./assets/room/controls/menu/resign.svg" />
									</div>
									<span>Resign</span>
								</div>
							)}
							{!recentlyOffered &&
								!gameOver &&
								game.player &&
								game.committed && (
									<div
										onclick={offer("draw")}
										class="menu-item"
										role="menu-item"
										id="menu-item-1"
										tabindex="-1"
									>
										<div class="menu-icon">
											<img src="./assets/room/controls/menu/draw.svg" />
										</div>
										<span>Offer Draw</span>
									</div>
								)}
							{!recentlyOffered &&
								gameOver &&
								game.player &&
								!roomClosed && (
									<div
										onclick={offer("rematch")}
										class="menu-item"
										role="menu-item"
										id="menu-item-2"
										tabindex="-1"
									>
										<div class="menu-icon">
											<img src="./assets/room/controls/menu/rematch.svg" />
										</div>
										<span>Rematch</span>
									</div>
								)}
							<div
								onclick={openPanel("chat")}
								class="menu-item"
								role="menu-item"
								id="menu-item-2"
								tabindex="-1"
							>
								<div class="menu-icon">
									<img src="./assets/room/controls/menu/chat.svg" />
								</div>
								<span>Chat</span>
							</div>
							<div
								onclick={openPanel("moves")}
								class="menu-item"
								role="menu-item"
								id="menu-item-3"
								tabindex="-1"
							>
								<div class="menu-icon">
									<img src="./assets/room/controls/menu/review.svg" />
								</div>
								<span>Review Moves</span>
							</div>
							<div
								onclick={openPanel("media")}
								class="menu-item"
								role="menu-item"
								id="menu-item-4"
								tabindex="-1"
							>
								<div class="menu-icon">
									<img src="./assets/room/controls/menu/media.svg" />
								</div>
								<span>Play Media</span>
							</div>
							{!isSpectator && (
								<div
									onclick={() => flipCamera(game.playerColor)}
									class="menu-item"
									role="menu-item"
									id="menu-item-5"
									tabindex="-1"
								>
									<div class="menu-icon">
										<img src="./assets/room/controls/menu/rotate-camera.svg" />
									</div>
									<span>Flip Camera</span>
								</div>
							)}
						</div>
					)}
					<button
						onclick={toggleMenu}
						class={`control-btn first ${menuOpen && "active"}`}
					>
						<img
							src="./assets/room/controls/menu/menu.svg"
							// class="no-pointers"
						></img>
					</button>
				</div>
			);
		},
});




