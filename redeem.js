export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const {
      name,
      email,
      phone,
      voucherType,
      provider,
      amount,
      coinsUsed,
    } = req.body || {};

    if (!name || !email || !phone || !voucherType || !amount || !coinsUsed) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || "Siddiq3";
    const repo = process.env.GITHUB_REPO || "QuizData";
    const branch = process.env.GITHUB_BRANCH || "main";

    if (!token) {
      return res.status(500).json({ ok: false, message: "Server not configured" });
    }

    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      id: requestId,
      name,
      email,
      phone,
      voucherType,
      provider: provider || "unknown",
      amount: Number(amount),
      coinsUsed: Number(coinsUsed),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const path = `redeemRequests/${requestId}.json`;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const content = Buffer.from(JSON.stringify(payload, null, 2)).toString("base64");

    const ghResp = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `New redeem request: ${voucherType} ₹${amount}`,
        content,
        branch,
      }),
    });

    if (!ghResp.ok) {
      const err = await ghResp.text();
      return res.status(500).json({ ok: false, message: err || "GitHub write failed" });
    }

    return res.status(200).json({ ok: true, requestId });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e?.message || "Server error" });
  }
}
