const API_BASE = "https://TON-BACKEND.example.com/api";
// Exemples:
// GET  /wallet?userId=123
// POST /withdraw  { userId, paypalEmail }

const userId = "demo-user-123";
const POINTS_PER_EURO = 1000;
const MIN_WITHDRAW_EUR = 5.00;

function formatEur(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

function renderWallet(points) {
  const euros = points / POINTS_PER_EURO;

  document.getElementById("pointsValue").textContent =
    `${points} point${points > 1 ? "s" : ""}`;
  document.getElementById("eurosValue").textContent = formatEur(euros);

  const btn = document.getElementById("withdrawBtn");
  btn.disabled = euros < MIN_WITHDRAW_EUR;

  document.getElementById("statusMsg").textContent =
    euros < MIN_WITHDRAW_EUR
      ? `Retrait disponible à partir de ${formatEur(MIN_WITHDRAW_EUR)}`
      : "Retrait disponible";
}

async function loadWallet() {
  try {
    const res = await fetch(`${API_BASE}/wallet?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error("Impossible de charger le wallet");
    const data = await res.json();

    // attendu: { points: 1234, paypalEmail: "user@example.com" }
    renderWallet(data.points ?? 0);

    document.getElementById("withdrawBtn").addEventListener("click", async () => {
      await requestWithdraw(data.paypalEmail);
    });
  } catch (err) {
    document.getElementById("statusMsg").textContent = err.message;
  }
}

async function requestWithdraw(paypalEmail) {
  const status = document.getElementById("statusMsg");
  status.textContent = "Demande de retrait en cours...";

  try {
    const res = await fetch(`${API_BASE}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        paypalEmail
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Retrait refusé");

    status.textContent = "Retrait envoyé avec succès.";
  } catch (err) {
    status.textContent = err.message;
  }
}

loadWallet();
