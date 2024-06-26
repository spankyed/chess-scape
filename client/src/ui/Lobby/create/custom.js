import { h } from "hyperapp";
import debounce from "tiny-debounce";

export default (initial) => ({
	state: {
		controlsOpen: false,
		time: { minutes: "", increment: "3" },
		incDropdownOpen: false,
		customTimeSet: false,
		isSelectingOpp: false,
		opponents: ["angel", "anyone", "computer"],
		selectedOpp: "anyone",
		computerSkill: "easy",
		pinEnabled: true,
		// pinEnabled: false,
		pin: null,
	},
	actions: {
		openCustomControls: () => () => ({ controlsOpen: true }),
		ignoreCustomTime: () => () => ({ customTimeSet: false }),
		setTime:
			({ prop, value }) =>
			({ time, customTimeSet }) => ({
				time: {
					...time,
					increment: time.increment || "3",
					[prop]: value,
				},
				customTimeSet: prop && value && true,
			}),
		setComputerSkill: (computerSkill) => () => ({
			computerSkill,
			selectedOpp: "computer",
		}),
		selectOpp: (selectedOpp) => () => ({
			selectedOpp,
			isSelectingOpp: false,
		}),
		toggleOppMenu:
			() =>
			({ isSelectingOpp }) => ({ isSelectingOpp: !isSelectingOpp }),
		togglePin:
			() =>
			({ pinEnabled, pin }) => ({
				pinEnabled: !pinEnabled,
				pin: !pinEnabled ? pin : null,
			}),
		setPin: (pin) => () => ({ pin }),
		setIncDropdown: (val) => () => ({ incDropdownOpen:val }),
	},
	view:
		(state, actions) =>
		({ selectGameType, selectedGameType }) => {
			const {
				isSelectingOpp,
				pinEnabled,
				pin,
				opponents,
				selectedOpp,
				computerSkill,
				time,
				controlsOpen,
				customTimeSet,
				incDropdownOpen
			} = state;
			const {
				selectOpp,
				toggleOppMenu,
				togglePin,
				setPin,
				setTime,
				setComputerSkill,
				openCustomControls,
				setIncDropdown
			} = actions;
			const type = { name: "Custom" };

			return (
				<div
					onclick={openCustomControls}
					class={`custom ${selectedGameType == 4 && "selected"}`}
				>
					{!controlsOpen ? (
						<div class="open-controls">
							<h2 class="name">{type.name}</h2>
							<img src="./assets/lobby/create/types/custom.svg" />
						</div>
					) : (
						<div class="controls">
							<h2 class="name"> {type.name} </h2>
							<TimeControl
								{...{
									setTime,
									time,
									selectGameType,
									selectedGameType,
									customTimeSet,
									setIncDropdown,
									incDropdownOpen,
								}}
							/>
							{/* todo add dropdown icon to indicate opp select? */}
							<OpponentSelect
								{...{
									isSelectingOpp,
									selectedOpp,
									toggleOppMenu,
									opponents,
									selectOpp,
									computerSkill,
									setComputerSkill,
								}}
							/>
							<PinProtect
								{...{ setPin, togglePin, pinEnabled, pin }}
							/>
						</div>
					)}
				</div>
			);
		},
});

function TimeControl({
	setTime,
	time,
	selectGameType,
	selectedGameType,
	customTimeSet,
	setIncDropdown,
	incDropdownOpen,
}) {
	const formatTime = ({ value }) => {
		if (value > 60) return value.toString().substring(0, 1);
		if (value < 1) return "";
		return value
			.toString()
			.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
			.substring(0, 2);
	};

	const isSelected = selectedGameType == 4;

	const handleTimeInput =
		(prop) =>
		({ target }) => {
			let { customTimeSet: timeSet } = setTime({
				prop,
				value: formatTime(target),
			});
			if (isSelected && !timeSet) selectGameType(0);
			// reset to init game type when no time set
			else if (!isSelected && timeSet) selectGameType(4); // set game type to custom when custom time inputted
			};
	
	const focusInput = (ev) => ev.currentTarget.querySelector('input')?.focus();
	
	const tempDisabled = true;
	return (
		<div class="time-wrapper">
			<div class="control time" onclick={!tempDisabled && focusInput}>
				<span class="clock identity">
					<img src="./assets/lobby/create/custom/clock.svg" />
				</span>
				<div class={`minutes-input ${tempDisabled && "temp-disabled"}`}>
					<label for="time" class="sr-only">
						time
					</label>
					<input
						oninput={debounce(handleTimeInput("minutes"), 50)}
						type="number"
						min="1"
						max="60"
						step="1"
						name="time"
						id="time"
						class="value"
						value={time.minutes}
						placeholder="—"
						disabled={tempDisabled}
					/>
					<div class="minutes-suffix">min</div>
				</div>
				<div
					class="ctrl-secondary temp-disabled"
					onclick={(e) => e.stopPropagation()}
				>
					<label for="increment" class="sr-only">
						increment
					</label>
					<IncrementDropdown
						{...{
							time,
							incDropdownOpen,
							setIncDropdown,
							disabled: !isSelected || tempDisabled,
							onchange: handleTimeInput("increment"),
						}}
					/>
				</div>
			</div>
		</div>
	);
}

function IncrementDropdown({
	incDropdownOpen,
	setIncDropdown,
	time,
	disabled,
	onchange,
}) {
	let increments = [1, 3, 10, 30];
	const onClick = (value) => () => {
		onchange({ target: { value }});
		setIncDropdown(false);
	}
	return (
		<div
			class={`increment-wrapper ${disabled && "disabled"}`}
			// class="relative inline-block text-left w-full h-full"
		>
			<button
				type="button"
				class="inc-select"
				name="increment"
				aria-haspopup="true"
				onclick={() => !disabled && setIncDropdown(!incDropdownOpen)}
			>
				{disabled ? (
					<div>
						— <span class="inc-p"> inc</span>
					</div>
				) : (
					<div>
						+ <span class="value">{time.increment}</span> sec
					</div>
				)}
			</button>
			{/* {true && ( */}
			{incDropdownOpen && !disabled && (
				<div class="inc-menu" role="menu" tabindex="-1">
					{increments.map((inc) => (
						<span
							class="increment"
							role="menuitem"
							tabindex="-1"
							id={`${inc}`}
							onclick={onClick(inc)}
						>
							+ <span class="value">{inc}</span> sec
						</span>
					))}
				</div>
			)}
		</div>
	);
}


function OpponentSelect({
	isSelectingOpp,
	selectedOpp,
	toggleOppMenu,
	opponents,
	selectOpp,
	computerSkill,
	setComputerSkill,
}) {
	return (
		<div
			class={`opponent-select ${isSelectingOpp && "opp-selecting"}`}
			oncreate={(e) => e.scrollIntoView()}
		>
			{/* {true ? ( */}
			{!isSelectingOpp ? (
				<SelectedOpponent {...{ selectedOpp, toggleOppMenu }} />
			) : (
				<OpponentMenu
					{...{
						opponents,
						selectOpp,
						selectedOpp,
						computerSkill,
						setComputerSkill,
					}}
				/>
			)}
		</div>
	);
}

function SelectedOpponent({ selectedOpp, toggleOppMenu }) {
	const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

	return (
		<div onclick={toggleOppMenu} class="control opp-menu-toggle">
			<span class="vs identity">VS</span>
			<div class="opp-img">
				<img src={`./assets/lobby/create/custom/${selectedOpp}.svg`} />
			</div>
			<span class="opp-name">{capitalize(selectedOpp)}</span>
			{/* todo add dropdown arrow? */}
		</div>
	);
}

function OpponentMenu({
	opponents,
	selectOpp,
	selectedOpp,
	computerSkill,
	setComputerSkill,
}) {
	return (
		<div class="opp-menu">
			{opponents.map((option) => (
				<div
					class={`control opp-option-wrapper
					${option == selectedOpp && " selected" }
					${option == "computer" && " temp-disabled"}
						`}
				>
					<OpponentOption {...{ option, selectOpp }} />
					{option === "computer" && (
						<ComputerSkillMenu
							{...{ computerSkill, setComputerSkill }}
						/>
					)}
				</div>
			))}
		</div>
	);
}
function OpponentOption({ option, selectOpp }) {
	const capitalize = (string) =>
		string.charAt(0).toUpperCase() + string.slice(1);
	return (
		<div onclick={() => selectOpp(option)} class={`opp-option ${option}`}>
			{/* <span class="vs">vs</span> */}
			<div class="img"><img src={`./assets/lobby/create/custom/${option}.svg`} /></div>
			<span class="opp-name">{capitalize(option)}</span>
		</div>
	);
}

function ComputerSkillMenu({ computerSkill,  setComputerSkill }) {
	return (
		<div class="ctrl-secondary computer-skill-menu temp-disabled">
			<label for="difficulty" class="sr-only">
				computer difficulty
			</label>
			<select
				onchange={({ target }) =>
					setComputerSkill(target.value)
				}
				value={computerSkill}
				id="difficulty"
				name="difficulty"
				class="difficulty"
			>
				<option value="random">Random</option>
				<option value="easy">Easy</option>
				<option value="hard">Hard</option>
				<option value="doom">D00M</option>
			</select>
		</div>
	);
}



function PinProtect({ setPin, togglePin, pinEnabled, pin }) {
	const focusInput = (ev) =>
		ev.currentTarget.parentElement
			.querySelector("input:not(.mobile)")
			.focus();
	return (
		<div class="pin-protect control">
			<span class="identity">
				<img src="./assets/lobby/create/custom/lock.svg" />
			</span>
			<label for="pin" class="sr-only">
				Private
			</label>
			{/* <div class="private mobile">Lock</div> */}
			<div class="private" onclick={focusInput}>
				Private
			</div>
			<div class="private mobile pin-wrapper">
				<Pin {...{ pin, setPin, pinEnabled, mobile: true }} />
			</div>
			<div class="ctrl-secondary pin-wrapper">
				<Pin {...{ pin, setPin, pinEnabled, mobile: false }} />
			</div>
		</div>
	);
}

function Pin({ pin, setPin, pinEnabled, mobile }) {
	return (
		<input
			name="pin"
			oninput={(e) => setPin(e.target.value)}
			value={pin}
			type="text"
			pattern="\d*"
			maxlength="4"
			placeholder="Pin"
			class={`value ${mobile && "mobile"}`}
			disabled={!pinEnabled}
			autocomplete="off"
		></input>
	);
}

export { Custom };
