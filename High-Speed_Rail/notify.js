(function () {
  let notificationSent = false;

  function getStoredSetting() {
    return new Promise((resolve) => {
      chrome.storage.sync.get("hsrSetting", ({ hsrSetting }) => {
        resolve(hsrSetting || {});
      });
    });
  }

  function textOrFallback(selector, fallback) {
    return document.querySelector(selector)?.textContent.trim() || fallback;
  }

  function buildTicketDetails() {
    const detailNode = document.querySelector(".uk-accordion-content");
    const detailRaw = detailNode ? detailNode.innerText.trim() : "無法取得票券資訊";

    const lines = detailRaw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.includes("QRCode") && !line.includes("小計"));

    let seenPrice = false;
    const cleanedLines = lines.filter((line) => {
      if (/^TWD\s*\d+/.test(line)) {
        if (seenPrice) return false;
        seenPrice = true;
      }

      return true;
    });

    return cleanedLines.join("\n") || "無法取得票券資訊";
  }

  function buildSeatText() {
    const seatNodes = document.querySelectorAll(".seating .seat-label span");
    const seats = Array.from(seatNodes)
      .map((node) => node.textContent.trim())
      .filter(Boolean)
      .join("、");

    return seats || "無法取得座位資訊";
  }

  function buildPayload() {
    const pnr = textOrFallback(".pnr-code span", "未知");
    const date = textOrFallback(".date span", "未知");
    const depTime =
      textOrFallback("#setTrainDeparture0", "") ||
      textOrFallback(".departure-time span", "未知");
    const arrTime =
      textOrFallback("#setTrainArrival0", "") ||
      textOrFallback(".arrival-time span", "未知");
    const depStation = textOrFallback(".departure .departure-stn span", "未知");
    const arrStation = textOrFallback(".arrival .arrival-stn span", "未知");
    const payDeadline = textOrFallback(
      ".payment-status .status-unpaid span:nth-child(3)",
      "無資料"
    );

    return {
      username: "高鐵訂位助手",
      content: "🚄 高鐵購票成功通知！",
      embeds: [
        {
          title: `${depStation} → ${arrStation}`,
          color: 0xffcc00,
          fields: [
            {
              name: "🔐 訂位代號",
              value: pnr,
              inline: false
            },
            {
              name: "📅 日期",
              value: `${date}\n${depTime} → ${arrTime}`,
              inline: false
            },
            {
              name: "💺 座位資訊",
              value: buildSeatText(),
              inline: false
            },
            {
              name: "🎟 票券資訊",
              value: buildTicketDetails(),
              inline: false
            },
            {
              name: "💰 付款期限",
              value: payDeadline,
              inline: false
            }
          ],
          footer: {
            text: "高鐵訂位完成"
          },
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  window.sendDiscordNotification = async function sendDiscordNotification() {
    if (notificationSent) return;

    const { webhookUrl } = await getStoredSetting();
    if (!webhookUrl) {
      console.warn("Discord webhook URL is empty. Skip notification.");
      return;
    }

    notificationSent = true;

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload())
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed with status ${response.status}`);
      }

      console.log("Discord notification sent.");
    } catch (error) {
      notificationSent = false;
      console.error("Failed to send Discord notification.", error);
    }
  };
})();
