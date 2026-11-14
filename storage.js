// Tiny localStorage wrapper so a page refresh (common on mobile) doesn't wipe a game.
const store = {
	load(key) {
		try {
			const raw = localStorage.getItem("cardscore:" + key);
			return raw ? JSON.parse(raw) : null;
		} catch (e) {
			return null;
		}
	},
	save(key, value) {
		try {
			localStorage.setItem("cardscore:" + key, JSON.stringify(value));
		} catch (e) {
			/* storage unavailable (private mode etc.) — ignore */
		}
	},
	clear(key) {
		try {
			localStorage.removeItem("cardscore:" + key);
		} catch (e) {}
	}
};

function uid() {
	return Date.now() + Math.random();
}

// Treat "", null, undefined as "not entered yet"
function isEntered(v) {
	return v !== "" && v !== null && v !== undefined && !isNaN(v);
}

// "sai sardesai" -> "Sai Sardesai" (first letter of each word uppercase, rest untouched)
function capName(name) {
	return name.trim().replace(/(^|\s)(\S)/g, (m, sp, ch) => sp + ch.toUpperCase());
}
