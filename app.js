class Gamer {
	constructor(name) {
		this.id = Date.now() + Math.random(); // Unique ID for Vue key
		this.name = name;
		this.currentScore = 0;
		this.totalScore = 0;
		this.isBusted = false;
		this.scoreUpdated = false;
	}
}

const app = new Vue({
	el: "#app",
	data: {
		lowestScore: 0,
		gamers: [],
		newMemberName: "",
		currentRound: 0,
		gameStatus: "",
		gameHistory: [],
		lastRoundState: null
	},
	computed: {
		activePlayersCount() {
			return this.gamers.filter(gamer => !gamer.isBusted).length;
		},
		bustedPlayersCount() {
			return this.gamers.filter(gamer => gamer.isBusted).length;
		},
		canCalculateScores() {
			if (this.gamers.length < 2) return false;
			const activePlayers = this.gamers.filter(gamer => !gamer.isBusted);
			return activePlayers.length >= 2 && activePlayers.every(gamer => 
				gamer.currentScore !== null && gamer.currentScore !== undefined && gamer.currentScore !== ""
			);
		},
		canUndo() {
			return this.gameHistory.length > 0;
		},
		winner() {
			const activePlayers = this.gamers.filter(gamer => !gamer.isBusted);
			return activePlayers.length === 1 ? activePlayers[0] : null;
		}
	},
	methods: {
		addMember() {
			const trimmedName = this.newMemberName.trim();
			if (!trimmedName) {
				return;
			}
			
			// Check for duplicate names
			if (this.gamers.some(gamer => gamer.name.toLowerCase() === trimmedName.toLowerCase())) {
				return;
			}
			
			this.gamers.push(new Gamer(trimmedName));
			this.newMemberName = "";
			
			// Update game status after adding player
			this.checkGameStatus();
		},
		
		validateScore(gamer) {
			// Ensure score is a valid number
			if (gamer.currentScore === "" || gamer.currentScore === null) {
				gamer.currentScore = 0;
			}
			gamer.currentScore = Math.max(0, Math.min(999, parseInt(gamer.currentScore) || 0));
		},
		
		clearScoreInput(event) {
			// Clear the input when focused if it contains 0
			if (event.target.value === "0" || event.target.value === 0) {
				event.target.value = "";
			}
		},
		
		computeScores() {
			if (!this.canCalculateScores) {
				return;
			}
			
			// Save current state for undo
			this.saveCurrentState();
			
			const activePlayers = this.gamers.filter(gamer => !gamer.isBusted);
			const scores = activePlayers.map(gamer => parseInt(gamer.currentScore) || 0);
			this.lowestScore = Math.min(...scores);
			
			// Create round data for history
			const roundData = {
				roundNumber: this.currentRound + 1,
				players: activePlayers.map(gamer => ({
					name: gamer.name,
					score: parseInt(gamer.currentScore) || 0
				}))
			};
			
			// Update scores
			this.gamers.forEach(gamer => {
				if (!gamer.isBusted) {
					const currentScore = parseInt(gamer.currentScore) || 0;
					const pointsToAdd = currentScore - this.lowestScore;
					gamer.totalScore += pointsToAdd;
					gamer.currentScore = 0;
					gamer.scoreUpdated = true;
					
					// Check if busted
					if (gamer.totalScore > 100) {
						gamer.isBusted = true;
					}
					
					// Remove animation class after animation completes
					setTimeout(() => {
						gamer.scoreUpdated = false;
					}, 600);
				}
			});
			
			// Add to history
			this.gameHistory.push(roundData);
			this.currentRound++;
			
			// Check for winner
			this.checkGameStatus();
		},
		
		checkGameStatus() {
			const activePlayers = this.gamers.filter(gamer => !gamer.isBusted);
			
			// Only show game status if we have at least 2 players and have started playing
			if (this.gamers.length < 2) {
				this.gameStatus = "";
				return;
			}
			
			if (activePlayers.length === 0) {
				this.gameStatus = "🎉 All players are busted! Game Over!";
			} else if (activePlayers.length === 1 && this.currentRound > 0) {
				this.gameStatus = `🏆 Winner: ${activePlayers[0].name}! Congratulations!`;
			} else if (this.currentRound > 0) {
				this.gameStatus = `🎮 ${activePlayers.length} players remaining. Game continues!`;
			} else {
				this.gameStatus = `🎮 Ready to start! ${activePlayers.length} players in the game.`;
			}
		},
		
		saveCurrentState() {
			this.lastRoundState = {
				gamers: JSON.parse(JSON.stringify(this.gamers)),
				currentRound: this.currentRound,
				lowestScore: this.lowestScore,
				gameHistory: JSON.parse(JSON.stringify(this.gameHistory))
			};
		},
		
		undoLastRound() {
			if (!this.lastRoundState) {
				return;
			}
			
			this.gamers = this.lastRoundState.gamers;
			this.currentRound = this.lastRoundState.currentRound;
			this.lowestScore = this.lastRoundState.lowestScore;
			this.gameHistory = this.lastRoundState.gameHistory;
			this.lastRoundState = null;
			
			this.checkGameStatus();
		},
		
		resetGame() {
			if (this.gamers.length > 0) {
				if (!confirm("Are you sure you want to reset the game? This will clear all players and scores.")) {
					return;
				}
			}
			
			this.gamers = [];
			this.currentRound = 0;
			this.lowestScore = 0;
			this.gameStatus = "";
			this.gameHistory = [];
			this.lastRoundState = null;
			this.newMemberName = "";
		},
		
		showNotification(message, type = "info") {
			// Create a simple notification system
			const notification = document.createElement('div');
			notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
			notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
			notification.innerHTML = `
				${message}
				<button type="button" class="close" data-dismiss="alert">
					<span>&times;</span>
				</button>
			`;
			
			document.body.appendChild(notification);
			
			// Auto remove after 3 seconds
			setTimeout(() => {
				if (notification.parentNode) {
					notification.remove();
				}
			}, 3000);
		}
	},
	
	watch: {
		// Watch for winner changes - only set status if game has actually been played
		winner(newWinner) {
			if (newWinner && this.currentRound > 0) {
				this.gameStatus = `🏆 Winner: ${newWinner.name}! Congratulations!`;
			}
		}
	},
	
	mounted() {
		// Initialize the game
	}
});
