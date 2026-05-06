const THSR_TIMES = [
  "00:00", "00:30",
  "05:00", "05:30", "06:00", "06:30",
  "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30",
  "23:00", "23:30"
];

const DEFAULT_STEP_1_QUERY_SECONDS = 150;
const DEFAULT_STEP_2_RELOAD_SECONDS = 150;

function populateTimeSelect(selectId, placeholder) {
  const select = document.getElementById(selectId);
  select.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = placeholder;
  select.appendChild(emptyOption);

  THSR_TIMES.forEach((time) => {
    const option = document.createElement("option");
    option.value = time;
    option.textContent = time;
    select.appendChild(option);
  });
}

function normalizePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

populateTimeSelect("time", "\u8acb\u9078\u64c7");
populateTimeSelect("latestTime", "\u4e0d\u9650\u5236");

chrome.storage.sync.get("hsrSetting", ({ hsrSetting }) => {
  if (!hsrSetting) {
    document.getElementById("step1QuerySeconds").value = DEFAULT_STEP_1_QUERY_SECONDS;
    document.getElementById("step2ReloadSeconds").value = DEFAULT_STEP_2_RELOAD_SECONDS;
    return;
  }

  document.getElementById("autoMode").checked = !!hsrSetting.autoMode;

  if (hsrSetting.date) document.getElementById("date").value = hsrSetting.date;
  if (hsrSetting.time) document.getElementById("time").value = hsrSetting.time;
  if (hsrSetting.latestTime) document.getElementById("latestTime").value = hsrSetting.latestTime;
  if (hsrSetting.start) document.getElementById("start").value = hsrSetting.start;
  if (hsrSetting.end) document.getElementById("end").value = hsrSetting.end;
  if (hsrSetting.ticketType) document.getElementById("ticketType").value = hsrSetting.ticketType;
  if (hsrSetting.count) document.getElementById("count").value = hsrSetting.count;
  if (hsrSetting.p1) document.getElementById("p1_id").value = hsrSetting.p1;
  if (hsrSetting.p2) document.getElementById("p2_id").value = hsrSetting.p2;
  if (hsrSetting.phone) document.getElementById("phone").value = hsrSetting.phone;
  if (hsrSetting.email) document.getElementById("email").value = hsrSetting.email;
  if (hsrSetting.webhookUrl) document.getElementById("webhookUrl").value = hsrSetting.webhookUrl;

  document.getElementById("step1QuerySeconds").value = normalizePositiveInt(
    hsrSetting.step1QuerySeconds,
    DEFAULT_STEP_1_QUERY_SECONDS
  );
  document.getElementById("step2ReloadSeconds").value = normalizePositiveInt(
    hsrSetting.step2ReloadSeconds,
    DEFAULT_STEP_2_RELOAD_SECONDS
  );
});

function saveSetting() {
  const earliest = document.getElementById("time").value;
  const latest = document.getElementById("latestTime").value;

  if (earliest && latest && earliest > latest) {
    alert("\u6700\u665a\u51fa\u767c\u6642\u9593\u4e0d\u80fd\u65e9\u65bc\u6700\u65e9\u51fa\u767c\u6642\u9593\u3002");
    return false;
  }

  const step1QuerySeconds = normalizePositiveInt(
    document.getElementById("step1QuerySeconds").value,
    DEFAULT_STEP_1_QUERY_SECONDS
  );
  const step2ReloadSeconds = normalizePositiveInt(
    document.getElementById("step2ReloadSeconds").value,
    DEFAULT_STEP_2_RELOAD_SECONDS
  );

  document.getElementById("step1QuerySeconds").value = step1QuerySeconds;
  document.getElementById("step2ReloadSeconds").value = step2ReloadSeconds;

  const data = {
    autoMode: document.getElementById("autoMode").checked,
    date: document.getElementById("date").value,
    time: earliest,
    latestTime: latest,
    step1QuerySeconds,
    step2ReloadSeconds,
    start: document.getElementById("start").value,
    end: document.getElementById("end").value,
    ticketType: document.getElementById("ticketType").value,
    count: document.getElementById("count").value,
    p1: document.getElementById("p1_id").value,
    p2: document.getElementById("p2_id").value,
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    webhookUrl: document.getElementById("webhookUrl").value.trim()
  };

  chrome.storage.sync.set({ hsrSetting: data }, () => {
    console.log("\u8a2d\u5b9a\u5df2\u5132\u5b58\u3002", data);
  });

  return true;
}

document.getElementById("saveBtn").addEventListener("click", () => {
  if (!saveSetting()) return;
  alert("\u8a2d\u5b9a\u5df2\u5132\u5b58\u3002");
});

document.getElementById("autoMode").addEventListener("change", saveSetting);
