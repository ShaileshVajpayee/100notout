// Judgement (Kachuful): each round players bid how many hands they'll win.
// Hit the bid exactly -> 10 + bid points, otherwise 0. Highest total wins.
const TRUMPS = [
	{ symbol: "♠", name: "Spades", red: false },
	{ symbol: "♥", name: "Hearts", red: true },
	{ symbol: "♦", name: "Diamonds", red: true },
	{ symbol: "♣", name: "Clubs", red: false }
];

function judgementDefaults() {
	return {
		players: [],
		newName: "",
		phase: "setup", // setup | playing | done
		startCards: 7,
		goBackUp: false,
		rounds: [], // { cards, trump, bids: [], tricks: [], done }
		current: 0
	};
}

Vue.component("judgement-game", {
	template: "#judgement-template",
	data() {
		return Object.assign(judgementDefaults(), store.load("judgement") || {});
	},
	computed: {
		trumps() {
			return TRUMPS;
		},
		maxCards() {
			const n = Math.max(this.players.length, 2);
			return Math.min(13, Math.floor(52 / n));
		},
		cardOptions() {
			return Array.from({ length: this.maxCards }, (_, i) => this.maxCards - i);
		},
		plannedRounds() {
			const down = [];
			for (let c = this.startCards; c >= 1; c--) down.push(c);
			if (!this.goBackUp) return down;
			const up = [];
			for (let c = 2; c <= this.startCards; c++) up.push(c);
			return down.concat(up);
		},
		round() {
			return this.rounds[this.current] || null;
		},
		dealerIndex() {
			return this.players.length ? this.current % this.players.length : 0;
		},
		bidTotal() {
			return this.round ? this.round.bids.reduce((s, b) => s + (isEntered(b) ? Number(b) : 0), 0) : 0;
		},
		trickTotal() {
			return this.round ? this.round.tricks.reduce((s, t) => s + (isEntered(t) ? Number(t) : 0), 0) : 0;
		},
		allBidsIn() {
			return this.round && this.round.bids.every(isEntered);
		},
		allTricksIn() {
			return this.round && this.round.tricks.every(isEntered);
		},
		canFinishRound() {
			return this.allBidsIn && this.allTricksIn && this.trickTotal === this.round.cards;
		},
		totals() {
			return this.players.map((_, i) =>
				this.rounds.reduce((sum, r) => sum + (this.points(r, i) || 0), 0)
			);
		},
		topTotal() {
			return this.totals.length ? Math.max(...this.totals) : 0;
		},
		leaders() {
			if (!this.rounds.some(r => r.done)) return [];
			return this.players.filter((_, i) => this.totals[i] === this.topTotal);
		},
		statusText() {
			const names = this.leaders.map(p => p.name).join(" & ");
			if (this.phase === "done") {
				return this.leaders.length > 1
					? `🤝 Tie! ${names} with ${this.topTotal} points`
					: `🏆 Winner: ${names} with ${this.topTotal} points!`;
			}
			if (this.phase === "playing" && this.round) {
				const lead = this.leaders.length ? ` · Leading: ${names} (${this.topTotal})` : "";
				return `🎮 Round ${this.current + 1} of ${this.rounds.length}${lead}`;
			}
			return "";
		}
	},
	methods: {
		// 1-card rounds have no trump
		trumpOf(round) {
			return round.cards === 1 ? null : TRUMPS[round.trump];
		},
		points(round, i) {
			if (!round.done) return null;
			return Number(round.bids[i]) === Number(round.tricks[i]) ? 10 + Number(round.bids[i]) : 0;
		},
		made(round, i) {
			return round.done && Number(round.bids[i]) === Number(round.tricks[i]);
		},
		addPlayer() {
			const name = capName(this.newName);
			if (!name) return;
			if (this.players.some(p => p.name.toLowerCase() === name.toLowerCase())) return;
			this.players.push({ id: uid(), name });
			this.newName = "";
			this.clampStart();
		},
		removePlayer(i) {
			this.players.splice(i, 1);
			this.clampStart();
		},
		movePlayer(i, dir) {
			const j = i + dir;
			if (j < 0 || j >= this.players.length) return;
			const p = this.players.splice(i, 1)[0];
			this.players.splice(j, 0, p);
		},
		clampStart() {
			if (this.startCards > this.maxCards) this.startCards = this.maxCards;
		},
		startGame() {
			if (this.players.length < 2) return;
			const n = this.players.length;
			let t = 0;
			this.rounds = this.plannedRounds.map(cards => ({
				cards,
				trump: cards === 1 ? 0 : t++ % TRUMPS.length,
				bids: Array(n).fill(null),
				tricks: Array(n).fill(null),
				done: false
			}));
			this.current = 0;
			this.phase = "playing";
		},
		sanitize(arr, i) {
			const v = arr[i];
			if (!isEntered(v)) {
				this.$set(arr, i, null);
			} else {
				this.$set(arr, i, Math.max(0, Math.min(this.round.cards, parseInt(v, 10))));
			}
		},
		finishRound() {
			if (!this.canFinishRound) return;
			this.round.done = true;
			if (this.current + 1 >= this.rounds.length) {
				this.phase = "done";
			} else {
				this.current++;
			}
		},
		undoRound() {
			if (this.phase === "done") {
				this.rounds[this.current].done = false;
				this.phase = "playing";
				return;
			}
			if (this.current === 0) return;
			this.current--;
			this.rounds[this.current].done = false;
		},
		playAgain() {
			if (!confirm("Start a new game with the same players?")) return;
			this.rounds = [];
			this.current = 0;
			this.phase = "setup";
		},
		resetGame() {
			if (!confirm("Reset the game? This clears all players and scores.")) return;
			Object.assign(this.$data, judgementDefaults());
		}
	},
	watch: {
		$data: {
			handler(v) {
				store.save("judgement", v);
			},
			deep: true
		}
	}
});
