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

populateTimeSelect("time", "請選擇");
populateTimeSelect("latestTime", "不限制");

chrome.storage.sync.get("hsrSetting", ({ hsrSetting }) => {
  if (!hsrSetting) return;

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
});

function saveSetting() {
  const earliest = document.getElementById("time").value;
  const latest = document.getElementById("latestTime").value;

  if (earliest && latest && earliest > latest) {
    alert("最晚出發時間不能早於最早出發時間");
    return false;
  }

  const data = {
    autoMode: document.getElementById("autoMode").checked,
    date: document.getElementById("date").value,
    time: earliest,
    latestTime: latest,
    start: document.getElementById("start").value,
    end: document.getElementById("end").value,
    ticketType: document.getElementById("ticketType").value,
    count: document.getElementById("count").value,
    p1: document.getElementById("p1_id").value,
    p2: document.getElementById("p2_id").value
  };

  chrome.storage.sync.set({ hsrSetting: data }, () => {
    console.log("高鐵設定已儲存", data);
  });

  return true;
}

document.getElementById("saveBtn").addEventListener("click", () => {
  if (!saveSetting()) return;
  alert("設定已儲存");
});

document.getElementById("autoMode").addEventListener("change", saveSetting);
