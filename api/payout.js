export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const client = process.env.PAYPAL_CLIENT;
    const secret = process.env.PAYPAL_SECRET;

    if (!client || !secret) {
      return res.status(500).json({
        error: "missing_env",
        message: "PAYPAL_CLIENT ou PAYPAL_SECRET manquant."
      });
    }

    const { paypal_email, amount, request_id } = req.body || {};

    if (!paypal_email || !amount || !request_id) {
      return res.status(400).json({
        error: "missing_fields",
        message: "paypal_email, amount et request_id sont requis."
      });
    }

    const auth = Buffer.from(`${client}:${secret}`).toString("base64");

    // 1) Récupérer le token OAuth
    const tokenResponse = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      return res.status(500).json({
        error: "paypal_auth_failed",
        details: tokenData
      });
    }

    // 2) Envoyer le payout
    const payoutBody = {
      sender_batch_header: {
        sender_batch_id: `videobonus_${request_id}`,
        email_subject: "Votre retrait VideoBonus",
        email_message: "Votre retrait PayPal a été envoyé."
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: Number(amount).toFixed(2),
            currency: "EUR"
          },
          receiver: paypal_email,
          note: "Retrait VideoBonus",
          sender_item_id: String(request_id)
        }
      ]
    };

    const payoutResponse = await fetch("https://api-m.paypal.com/v1/payments/payouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payoutBody)
    });

    const payoutData = await payoutResponse.json();

    return res.status(payoutResponse.status).json(payoutData);
  } catch (error) {
    return res.status(500).json({
      error: "server_error",
      message: error.message || "Erreur serveur."
    });
  }
}
