import { h } from 'hyperapp';
import { getRandomFact } from "./randomFacts";

// designs based off following code pens
// https://codepen.io/_fbrz/pen/KvwIF
// https://codepen.io/crayon-code/pen/eYdVLJo

export default ({ isLoading, loaderText, setLoaderText }) => {
	if (!loaderText) {
		setLoaderText(getRandomFact());
	}
	return (
		<div class={`loader ${!true && "hide"}`}>
				<Mosaic />
			<div class="loader-wrapper">
				<h2>{loaderText || "Did you know?"}</h2>
			</div>
		</div>
	);
};

function Mosaic() {
	return (
		<div class="mosaic">
			<div class="cell d-0"></div>
			<div class="cell d-1"></div>
			<div class="cell d-2"></div>
			<div class="cell d-3"></div>
			<div class="cell d-1"></div>
			<div class="cell d-2"></div>
			<div class="cell d-3"></div>
			<div class="cell d-4"></div>
			<div class="cell d-2"></div>
			<div class="cell d-3"></div>
			<div class="cell d-4"></div>
			<div class="cell d-5"></div>
			<div class="cell d-3"></div>
			<div class="cell d-4"></div>
			<div class="cell d-5"></div>
			<div class="cell d-6"></div>
		</div>
	);
}