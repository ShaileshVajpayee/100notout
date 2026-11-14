// Satti Lavni (Sevens): 7 rounds, each player enters the points left in hand.
// Lowest total after 7 rounds wins.
const SATTI_ROUNDS = 7;

Vue.component("satti-lavni", {
	template: "#satti-template",
	data() {
		const saved = store.load("satti");
		return Object.assign({ players: [], newName: "" }, saved || {});
	},
	computed: {
		rounds() {
			return SATTI_ROUNDS;
		},
		// Index of the first round that isn't filled for every player (7 = all done)
		currentRound() {
			if (!this.players.length) return 0;
			for (let r = 0; r < SATTI_ROUNDS; r++) {
				if (!this.players.every(p => isEntered(p.scores[r]))) return r;
			}
			return SATTI_ROUNDS;
		},
		gameOver() {
			return this.players.length >= 2 && this.currentRound === SATTI_ROUNDS;
		},
		hasAnyScore() {
			return this.players.some(p => p.scores.some(isEntered));
		},
		lowestTotal() {
			if (!this.hasAnyScore) return null;
			return Math.min(...this.players.map(p => this.total(p)));
		},
		leaders() {
			if (this.lowestTotal === null) return [];
			return this.players.filter(p => this.total(p) === this.lowestTotal);
		},
		statusText() {
			if (this.players.length === 0) return "";
			if (this.players.length < 2) return "Add at least 2 players to start.";
			const names = this.leaders.map(p => p.name).join(" & ");
			if (this.gameOver) {
				return this.leaders.length > 1
					? `🤝 Tie! ${names} with ${this.lowestTotal} points`
					: `🏆 Winner: ${names} with ${this.lowestTotal} points!`;
			}
			const lead = this.leaders.length ? ` · Leading: ${names} (${this.lowestTotal})` : "";
			return `🎮 Round ${this.currentRound + 1} of ${SATTI_ROUNDS}${lead}`;
		}
	},
	methods: {
		total(p) {
			return p.scores.reduce((sum, s) => sum + (isEntered(s) ? Number(s) : 0), 0);
		},
		isLeader(p) {
			return this.leaders.includes(p);
		},
		addPlayer() {
			const name = capName(this.newName);
			if (!name) return;
			if (this.players.some(p => p.name.toLowerCase() === name.toLowerCase())) return;
			this.players.push({ id: uid(), name, scores: Array(SATTI_ROUNDS).fill(null) });
			this.newName = "";
		},
		removePlayer(i) {
			if (!confirm(`Remove ${this.players[i].name}?`)) return;
			this.players.splice(i, 1);
		},
		sanitize(p, r) {
			const v = p.scores[r];
			if (!isEntered(v)) {
				this.$set(p.scores, r, null);
			} else {
				this.$set(p.scores, r, Math.max(0, Math.min(999, parseInt(v, 10))));
			}
		},
		newGameSamePlayers() {
			if (!confirm("Start a new game with the same players?")) return;
			this.players.forEach(p => (p.scores = Array(SATTI_ROUNDS).fill(null)));
		},
		resetGame() {
			if (!confirm("Reset the game? This clears all players and scores.")) return;
			this.players = [];
			this.newName = "";
		}
	},
	watch: {
		$data: {
			handler(v) {
				store.save("satti", v);
			},
			deep: true
		}
	}
});
