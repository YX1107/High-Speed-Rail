// ===== 第 6 段：偵測完成訂位頁（有訂位代號）→ 發送 Discord Embed =====
(function () {
  console.log("第六段啟動");
  console.log("已啟用：偵測『完成訂位頁』並發送 Discord 通知");

  const webhookUrl =
    "xxx";

  function buildEmbed() {
    // ==== 訂位代號 ====
    const pnr =
      document.querySelector(".pnr-code span")?.textContent.trim() || "未知";

    // ==== 日期 ====
    const date =
      document.querySelector(".date span")?.textContent.trim() || "未知";

    // ==== 時間 ====
    const depTime =
      document.querySelector("#setTrainDeparture0")?.textContent.trim() ||
      document.querySelector(".departure-time span")?.textContent.trim() ||
      "未知";

    const arrTime =
      document.querySelector("#setTrainArrival0")?.textContent.trim() ||
      document.querySelector(".arrival-time span")?.textContent.trim() ||
      "未知";

    // ==== 車站 ====
    const depStation =
      document.querySelector(".departure .departure-stn span")?.textContent.trim() || "未知";
    const arrStation =
      document.querySelector(".arrival .arrival-stn span")?.textContent.trim() || "未知";

    // ==== 付款期限 ====
    const payDeadline =
      document.querySelector(".payment-status .status-unpaid span:nth-child(3)")?.textContent.trim() ||
      "無資料";

    // ==== 票券資訊（移除小計 + 重複金額） ====
    const detailNode = document.querySelector(".uk-accordion-content");
    let detailRaw = detailNode ? detailNode.innerText.trim() : "無法取得票券資訊";

    let lines = detailRaw
      .split("\n")
      .map(line => line.trim())
      .filter(line => line !== "" && !line.includes("小計"));

    // 只留第一個 TWD 價格
    let seenPrice = false;
    let cleanedLines = lines.filter(line => {
      if (/^TWD\s*\d+/.test(line)) {
        if (seenPrice) return false;
        seenPrice = true;
      }
      return true;
    });

    const detailText = cleanedLines.join("\n");

    // ==== 座位資訊 ====
    const seatNodes = document.querySelectorAll(".seating .seat-label span");
    let seats = Array.from(seatNodes)
      .map(s => s.textContent.trim())
      .filter(t => t !== "")
      .join("、");

    if (!seats) seats = "無法取得座位資訊";

    return {
      username: "高鐵訂位助手",
      content: "🚄 高鐵購票成功通知！",
      embeds: [
        {
          title: `${depStation} → ${arrStation}`,
          color: 0xffff00,
          fields: [
            {
              name: "🔐 訂位代號",
              value: pnr,
              inline: false,
            },
           {
              name: "📅 日期",
              value: `${date}\n${depTime} → ${arrTime}`,
              inline: false,
             },
            {
              name: "💺 座位資訊",
              value: seats,
              inline: false,
            },
            {
              name: "🎟 票券資訊",
              value: detailText,
              inline: false,
            },
            {
              name: "💰 付款期限",
              value: payDeadline,
              inline: false,
            },
          ],
          footer: { text: "高鐵訂位完成" },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  const doneInterval = setInterval(() => {
    const pnrEl = document.querySelector(".pnr-code span");

    if (pnrEl) {
      console.log("🎉 偵測到完成訂位頁，開始發送 Discord 通知");

      const payload = buildEmbed();

      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(() => console.log("📨 Discord Embed 已送出"))
        .catch(err => console.error("❌ Discord 送出失敗：", err))
        .finally(() => clearInterval(doneInterval));
    }
  }, 2000);
})();