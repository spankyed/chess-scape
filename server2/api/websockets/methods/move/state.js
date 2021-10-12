// initial board state, is set when match created
// when player moves, record only what changed in state
// can reconstruct every board state using initial state + list of moves/changes,
// with this method less data is required to sync game up to current move when spectator joins
// or if player gets out of sync due to network/runtime issues
module.exports = {
	captured: {
		white: 0,
		black: 0,
	},
	pieces: {
		b_w_1: true,
		b_w_2: true,
		p_w_1: true,
		p_w_2: true,
		p_w_3: true,
		p_w_4: true,
		p_w_5: true,
		p_w_6: true,
		p_w_7: true,
		p_w_8: true,
		q_w_1: true,
		r_w_1: true,
		r_w_2: true,
		n_w_1: true,
		n_w_2: true,
		k_w_1: true,
		b_b_1: true,
		b_b_2: true,
		p_b_1: true,
		p_b_2: true,
		p_b_3: true,
		p_b_4: true,
		p_b_5: true,
		p_b_6: true,
		p_b_7: true,
		p_b_8: true,
		q_b_1: true,
		r_b_1: true,
		r_b_2: true,
		n_b_1: true,
		n_b_2: true,
		k_b_1: true,
	},
	squares: {
		a1: "r_w_2",
		b1: "n_w_1",
		c1: "b_w_1",
		d1: "q_w_1",
		e1: "k_w_1",
		f1: "b_w_2",
		g1: "n_w_2",
		h1: "r_w_1",
		a2: "p_w_7",
		b2: "p_w_6",
		c2: "p_w_5",
		d2: "p_w_4",
		e2: "p_w_3",
		f2: "p_w_2",
		g2: "p_w_1",
		h2: "p_w_8",
		a3: null,
		b3: null,
		c3: null,
		d3: null,
		e3: null,
		f3: null,
		g3: null,
		h3: null,
		a4: null,
		b4: null,
		c4: null,
		d4: null,
		e4: null,
		f4: null,
		g4: null,
		h4: null,
		a5: null,
		b5: null,
		c5: null,
		d5: null,
		e5: null,
		f5: null,
		g5: null,
		h5: null,
		a6: null,
		b6: null,
		c6: null,
		d6: null,
		e6: null,
		f6: null,
		g6: null,
		h6: null,
		a7: "p_b_7",
		b7: "p_b_6",
		c7: "p_b_5",
		d7: "p_b_4",
		e7: "p_b_3",
		f7: "p_b_2",
		g7: "p_b_1",
		h7: "p_b_8",
		a8: "r_b_2",
		b8: "n_b_1",
		c8: "b_b_1",
		d8: "q_b_1",
		e8: "k_b_1",
		f8: "b_b_2",
		g8: "n_b_2",
		h8: "r_b_1",
	},
};