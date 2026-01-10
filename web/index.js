let heads = 0;
let tails = 0;
let flipping = false;
let headsInARow = 0;
let maxHeadsStreak = 0;
let cashCents = 0;

const flipButton = document.getElementById('flip');
const faceFrontEl = document.getElementById('faceFront');
const faceBackEl = document.getElementById('faceBack');
const coinEl = document.getElementById('coin');
const headsEl = document.getElementById('heads');
const tailsEl = document.getElementById('tails');
const totalEl = document.getElementById('total');
const headsChanceEl = document.getElementById('titleHeadsChance');
const headsInARowEl = document.getElementById('headsInARow');
const maxHeadsStreakEl = document.getElementById('maxHeadsStreak');
const cashEl = document.getElementById('cash');
const cashTextEl = document.getElementById('cashText');
const logEl = document.getElementById('log');
const coinBurstEl = document.getElementById('coinBurst');
const cashBurstsEl = document.getElementById('cashBursts');
const winExplosionEl = document.getElementById('winExplosion');
const winModalEl = document.getElementById('winModal');
const winKeepPlayingBtn = document.getElementById('winKeepPlaying');
const winStartOverBtn = document.getElementById('winStartOver');

// Only show the 10-heads celebration once per page load (but let the user keep playing).
let winShownEver = false;

function triggerWinExplosion() {
	if (!winExplosionEl) return;
	if (winShownEver) return;
	winShownEver = true;

	// If auto-flip is running, pause it before celebrating (but keep ownership).
	// This prevents the animation from being immediately "covered" by rapid state changes.
	if (autoFlipEnabled) stopAutoFlip();

	// restart animation reliably
	winExplosionEl.classList.remove('go');
	// eslint-disable-next-line no-unused-expressions
	winExplosionEl.offsetHeight;
	winExplosionEl.classList.add('go');

	// Show modal until user dismisses
	if (winModalEl) {
		winModalEl.classList.add('show');
		winModalEl.setAttribute('aria-hidden', 'false');
	}

	// Clean up class after the animation finishes (but keep winShownEver true)
	setTimeout(() => {
		winExplosionEl.classList.remove('go');
	}, 2600);
}

function hideWinModal() {
	if (!winModalEl) return;
	winModalEl.classList.remove('show');
	winModalEl.setAttribute('aria-hidden', 'true');
}

// --- Upgrades / economy (all in-memory) ---
let headsChance = 0.2; // base 20%
let flipTimeMs = 1000;
let comboMult = 1.0; // increases payout based on heads streak
let baseWorthCents = 1; // cents earned for a heads before combo multiplier
let autoFlipEnabled = false;
let autoFlipTimer = null;

// upgrades: capped levels, price scales by 10x each purchase, reward stays constant
const MAX_UPGRADES = 10;
const MAX_HEADS_CHANCE_UPGRADES = 6;
const MAX_FLIP_TIME_UPGRADES = 6;
const MAX_COMBO_MULT_UPGRADES = 6;
// baseWorth has 7 price points ($0.01 -> $100), which implies 6 purchases after the starting price
const MAX_BASE_WORTH_UPGRADES = 6;
let upgrades = {
	headsChance: 0,
	flipTime: 0,
	comboMult: 0,
	baseWorth: 0,
	autoFlip: 0, // 0 = not purchased, 1 = purchased
};

const BASE_PRICE = {
	headsChance: 10, // $0.10
	flipTime: 10, // $0.10
	comboMult: 10, // $0.10
	// Base coin worth upgrade cost scales: $0.25 -> $2.50 -> $25 -> $250 -> ...
	// (prices are in cents; pricing uses standard 10x exponent curve)
	baseWorth: 25, // $0.25
	autoFlip: 100000, // $1000.00
};

function priceFor(key) {
	return Math.round(BASE_PRICE[key] * Math.pow(10, upgrades[key]));
}

function upgradeAvailable(key) {
	if (key === 'headsChance') return upgrades[key] < MAX_HEADS_CHANCE_UPGRADES;
	if (key === 'flipTime') return upgrades[key] < MAX_FLIP_TIME_UPGRADES;
	if (key === 'comboMult') return upgrades[key] < MAX_COMBO_MULT_UPGRADES;
	if (key === 'baseWorth') return upgrades[key] < MAX_BASE_WORTH_UPGRADES;
	if (key === 'autoFlip') return upgrades[key] < 1;
	return upgrades[key] < MAX_UPGRADES;
}

const buyHeadsChanceBtn = document.getElementById('buyHeadsChance');
const buyFlipTimeBtn = document.getElementById('buyFlipTime');
const buyComboMultBtn = document.getElementById('buyComboMult');
const buyBaseWorthBtn = document.getElementById('buyBaseWorth');
const buyAutoFlipBtn = document.getElementById('buyAutoFlip');

function updateStats() {
	headsEl.textContent = heads;
	tailsEl.textContent = tails;
	totalEl.textContent = heads + tails;
	if (cashTextEl) cashTextEl.textContent = formatCents(cashCents);
	else if (cashEl) cashEl.textContent = formatCents(cashCents);
	if (headsInARowEl) headsInARowEl.textContent = headsInARow;
	if (maxHeadsStreakEl) maxHeadsStreakEl.textContent = maxHeadsStreak;
}

function updateOddsUI() {
	if (!headsChanceEl) return;
	headsChanceEl.textContent = (headsChance * 100).toFixed(2).replace(/\.00$/, '');
}

function setResult(value) {
	if (value === 'HEADS') {
		coinEl.dataset.side = 'heads';
	} else if (value === 'TAILS') {
		coinEl.dataset.side = 'tails';
	} else {
		coinEl.dataset.side = 'ready';
	}
}

function randomFlip() {
	return Math.random() < headsChance ? 'HEADS' : 'TAILS';
}

function formatCents(cents) {
	const dollars = cents / 100;
	return dollars.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function canAfford(priceCents) {
	return cashCents >= priceCents;
}

function updateShopUI() {
	const pHeadsChance = priceFor('headsChance');
	const pFlipTime = priceFor('flipTime');
	const pComboMult = priceFor('comboMult');
	const pBaseWorth = priceFor('baseWorth');
	const pAutoFlip = priceFor('autoFlip');

	if (buyHeadsChanceBtn)
		buyHeadsChanceBtn.disabled = !upgradeAvailable('headsChance') || !canAfford(pHeadsChance);
	if (buyFlipTimeBtn)
		buyFlipTimeBtn.disabled =
			!upgradeAvailable('flipTime') || !canAfford(pFlipTime) || flipTimeMs <= 100;
	if (buyComboMultBtn) buyComboMultBtn.disabled = !upgradeAvailable('comboMult') || !canAfford(pComboMult);
	if (buyBaseWorthBtn) buyBaseWorthBtn.disabled = !upgradeAvailable('baseWorth') || !canAfford(pBaseWorth);
	if (buyAutoFlipBtn)
		buyAutoFlipBtn.disabled =
			(upgrades.autoFlip < 1 && !canAfford(pAutoFlip)) || false;

	// optional: update button labels with current values
	if (buyHeadsChanceBtn) {
		const nameEl = buyHeadsChanceBtn.querySelector('.shop-item-desc');
		if (nameEl)
			nameEl.textContent = `+0.05 heads chance (lvl ${upgrades.headsChance}/${MAX_HEADS_CHANCE_UPGRADES}, now ${(headsChance * 100).toFixed(0)}%)`;
		const priceEl = buyHeadsChanceBtn.querySelector('.price');
		if (priceEl)
			priceEl.textContent = upgradeAvailable('headsChance') ? formatCents(pHeadsChance) : '';
	}
	if (buyFlipTimeBtn) {
		const descEl = buyFlipTimeBtn.querySelector('.shop-item-desc');
		if (descEl)
			descEl.textContent = `-0.1s flip time (lvl ${upgrades.flipTime}/${MAX_FLIP_TIME_UPGRADES}, now ${(flipTimeMs / 1000).toFixed(2)}s, min 0.10s)`;
		const priceEl = buyFlipTimeBtn.querySelector('.price');
		if (priceEl)
			priceEl.textContent = upgradeAvailable('flipTime') ? formatCents(pFlipTime) : '';
	}
	if (buyComboMultBtn) {
		const descEl = buyComboMultBtn.querySelector('.shop-item-desc');
		if (descEl)
			descEl.textContent = `+0.5x combo mult (lvl ${upgrades.comboMult}/${MAX_COMBO_MULT_UPGRADES}, now ${comboMult.toFixed(1)}x)`;
		const priceEl = buyComboMultBtn.querySelector('.price');
		if (priceEl)
			priceEl.textContent = upgradeAvailable('comboMult') ? formatCents(pComboMult) : '';
	}
	if (buyBaseWorthBtn) {
		const descEl = buyBaseWorthBtn.querySelector('.shop-item-desc');
		if (descEl) {
			const steps = [1, 10, 100, 1000, 2500, 5000, 10000];
			const nextIdx = Math.min(upgrades.baseWorth + 1, steps.length - 1);
			const nextVal = steps[nextIdx];
			descEl.textContent = upgradeAvailable('baseWorth')
				? `Upgrade base worth (lvl ${upgrades.baseWorth}/${MAX_BASE_WORTH_UPGRADES}, now ${formatCents(baseWorthCents)} → ${formatCents(nextVal)})`
				: `Maxed (now ${formatCents(baseWorthCents)})`;
		}
		const priceEl = buyBaseWorthBtn.querySelector('.price');
		if (priceEl)
			priceEl.textContent = upgradeAvailable('baseWorth') ? formatCents(pBaseWorth) : '';
	}
	if (buyAutoFlipBtn) {
		const descEl = buyAutoFlipBtn.querySelector('.shop-item-desc');
		if (descEl)
			descEl.textContent =
				upgrades.autoFlip < 1
					? 'Flips forever (click to buy)'
					: autoFlipEnabled
						? 'ON (click to turn off)'
						: 'OFF (click to turn on)';
		const priceEl = buyAutoFlipBtn.querySelector('.price');
		if (priceEl) priceEl.textContent = upgrades.autoFlip < 1 ? formatCents(pAutoFlip) : '';
	}
}

function logFlip(outcome) {
	if (!logEl) return;

	const line = document.createElement('div');
	line.classList.add('log-line');

	if (outcome === 'HEADS') {
		line.classList.add('heads');
		// Heads! Heads!! Heads!!! ... number of "!" == current heads streak
		line.textContent = `Heads${'!'.repeat(Math.max(1, headsInARow))}`;
	} else {
		line.classList.add('tails');
		line.textContent = 'Tails...';
	}

	logEl.appendChild(line);
	// keep newest at bottom, auto-scroll (stick to bottom)
	logEl.scrollTo({ top: logEl.scrollHeight, behavior: 'smooth' });
}

function logShopPurchase(message) {
	if (!logEl) return;
	const line = document.createElement('div');
	line.classList.add('log-line', 'shop');
	line.textContent = message;
	logEl.appendChild(line);
	logEl.scrollTo({ top: logEl.scrollHeight, behavior: 'smooth' });
}

// --- Utility commands (typed anywhere) ---
// /auto-flip            -> grants auto-flip upgrade for free (and turns it on)
// /show-me-the-money    -> grants $10,000.00
function handleUtilityCommand(cmdRaw) {
	const cmd = String(cmdRaw || '').trim().toLowerCase();
	if (!cmd.startsWith('/')) return false;

	if (cmd === '/auto-flip') {
		if (upgrades.autoFlip < 1) {
			upgrades.autoFlip = 1;
			logShopPurchase('Cheat: auto-flip granted');
		} else {
			logShopPurchase('Cheat: auto-flip already owned');
		}
		startAutoFlip();
		updateShopUI();
		return true;
	}

	if (cmd === '/show-me-the-money') {
		cashCents += 1000000; // $10,000.00
		logShopPurchase('Cheat: +$10,000.00');
		updateStats();
		updateShopUI();
		return true;
	}

	return false;
}

// Capture typing anywhere without adding UI; submit command on Enter
let commandBuffer = '';
document.addEventListener('keydown', (e) => {
	// Ignore typing in form controls/contenteditable (none currently, but safe)
	const t = e.target;
	if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

	if (e.key === 'Enter') {
		if (commandBuffer.trim().startsWith('/')) {
			const handled = handleUtilityCommand(commandBuffer);
			// Clear buffer either way so it doesn't keep growing
			commandBuffer = '';
			if (handled) {
				e.preventDefault();
				e.stopPropagation();
			}
		} else {
			commandBuffer = '';
		}
		return;
	}

	if (e.key === 'Backspace') {
		commandBuffer = commandBuffer.slice(0, -1);
		return;
	}

	// Only collect "printable" characters
	if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
		// Start buffering only after a leading slash, but still record everything once started
		if (commandBuffer.length === 0 && e.key !== '/') return;
		commandBuffer += e.key;
		// Hard cap so we never grow unbounded
		if (commandBuffer.length > 64) commandBuffer = commandBuffer.slice(0, 64);
	}
});

function burstMoney(text = '+$0.01') {
	// Prefer showing earnings over the Cash stat; fall back to coin burst if needed.
	if (cashBurstsEl) {
		const el = document.createElement('span');
		el.className = 'cash-burst money show';
		el.textContent = text;
		// Randomize x offset a bit so multiple bursts are readable
		el.style.setProperty('--x', `${Math.round((Math.random() - 0.5) * 36)}px`);
		cashBurstsEl.appendChild(el);

		// Remove after animation finishes (keep DOM clean)
		setTimeout(() => {
			el.remove();
		}, 900);
		return;
	}

	// fallback to legacy coin burst (single)
	if (!coinBurstEl) return;
	coinBurstEl.textContent = text;
	coinBurstEl.classList.remove('show');
	// eslint-disable-next-line no-unused-expressions
	coinBurstEl.offsetHeight;
	coinBurstEl.classList.add('show');
}

async function flip() {
	if (flipping) return;
	// If the win modal is up, don't flip until user chooses Keep Playing
	if (winModalEl && winModalEl.classList.contains('show')) return;
	flipping = true;
	flipButton.disabled = true;

	// match CSS flip animation duration to current flip time
	coinEl.style.setProperty('--flip-duration', `${flipTimeMs}ms`);

	coinEl.classList.add('flipping');

	await new Promise((r) => setTimeout(r, flipTimeMs));

	const outcome = randomFlip();
	if (outcome === 'HEADS') {
		// earn money: baseWorth * (1 + comboMult * (streak-1))
		// (streak is incremented below, so compute after increment)
		heads++;
		headsInARow++;
		if (headsInARow > maxHeadsStreak) maxHeadsStreak = headsInARow;
		if (headsInARow >= 10) triggerWinExplosion();

		const payoutCents = Math.max(
			0,
			Math.round(baseWorthCents * (1 + comboMult * Math.max(0, headsInARow - 1))),
		);
		cashCents += payoutCents;
		burstMoney(`+${formatCents(payoutCents)}`);
	} else {
		tails++;
		headsInARow = 0;
	}

	setResult(outcome);
	logFlip(outcome);
	updateStats();
	updateOddsUI();
	updateShopUI();

	coinEl.classList.remove('flipping');
	flipButton.disabled = false;
	flipping = false;
}

function purchase(priceCents, onPurchase) {
	if (!canAfford(priceCents)) return false;
	cashCents -= priceCents;
	onPurchase();
	updateStats();
	updateOddsUI();
	updateShopUI();
	return true;
}

function startAutoFlip() {
	if (autoFlipEnabled) return;
	autoFlipEnabled = true;
	if (autoFlipTimer) clearInterval(autoFlipTimer);
	// Keep it simple: attempt a flip regularly; flip() will no-op if currently flipping.
	// Add a small buffer so the next flip doesn't start immediately after the previous finishes.
	const bufferMs = 100;
	autoFlipTimer = setInterval(() => {
		flip();
	}, Math.max(120, flipTimeMs + bufferMs));
}

function stopAutoFlip() {
	autoFlipEnabled = false;
	if (autoFlipTimer) clearInterval(autoFlipTimer);
	autoFlipTimer = null;
	updateShopUI();
}

function toggleAutoFlip() {
	if (upgrades.autoFlip < 1) return;
	if (autoFlipEnabled) stopAutoFlip();
	else startAutoFlip();
	updateShopUI();
}

flipButton.addEventListener('click', flip);
coinEl.addEventListener('click', flip);
// oddsGrowthEl removed from UI; keep heads chance display only

// Initial state
updateStats();
setResult(null);
updateOddsUI();
updateShopUI();

// Set initial coin faces (static labels for the two sides)
if (faceFrontEl) faceFrontEl.textContent = 'H';
if (faceBackEl) faceBackEl.textContent = 'T';

if (buyHeadsChanceBtn) {
	buyHeadsChanceBtn.addEventListener('click', () => {
		if (!upgradeAvailable('headsChance')) return;
		purchase(priceFor('headsChance'), () => {
			headsChance = Math.min(0.5, headsChance + 0.05);
			upgrades.headsChance++;
		});
		logShopPurchase('+5% heads');
	});
}

if (buyFlipTimeBtn) {
	buyFlipTimeBtn.addEventListener('click', () => {
		if (!upgradeAvailable('flipTime')) return;
		purchase(priceFor('flipTime'), () => {
			flipTimeMs = Math.max(100, flipTimeMs - 100);
			upgrades.flipTime++;
			// if auto-flipping, restart timer at new pace
			if (autoFlipEnabled) {
				stopAutoFlip();
				startAutoFlip();
			}
		});
		logShopPurchase('-0.1s flip');
	});
}

if (buyComboMultBtn) {
	buyComboMultBtn.addEventListener('click', () => {
		if (!upgradeAvailable('comboMult')) return;
		purchase(priceFor('comboMult'), () => {
			comboMult += 0.5;
			upgrades.comboMult++;
		});
		logShopPurchase('+0.5x combo');
	});
}

if (buyBaseWorthBtn) {
	buyBaseWorthBtn.addEventListener('click', () => {
		if (!upgradeAvailable('baseWorth')) return;
		purchase(priceFor('baseWorth'), () => {
			// Upgrade base coin worth reward to scale:
			// $0.01 -> $0.10 -> $1 -> $10 -> $25 -> $50 -> $100
			// (values are in cents)
			const steps = [1, 10, 100, 1000, 2500, 5000, 10000];
			const nextLevel = Math.min(upgrades.baseWorth + 1, steps.length - 1);
			baseWorthCents = steps[nextLevel];
			upgrades.baseWorth++;
		});
		logShopPurchase(`Base worth: ${formatCents(baseWorthCents)}`);
	});
}

if (buyAutoFlipBtn) {
	buyAutoFlipBtn.addEventListener('click', () => {
		// First click buys it; after that, toggles ON/OFF
		if (upgrades.autoFlip < 1) {
			purchase(priceFor('autoFlip'), () => {
				upgrades.autoFlip = 1;
				startAutoFlip();
			});
			logShopPurchase('Auto-flip');
			return;
		}

		toggleAutoFlip();
	});
}

if (winKeepPlayingBtn) {
	winKeepPlayingBtn.addEventListener('click', () => {
		hideWinModal();
	});
}

if (winStartOverBtn) {
	winStartOverBtn.addEventListener('click', () => {
		// Full refresh as requested
		window.location.reload();
	});
}
