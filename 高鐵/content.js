chrome.storage.sync.get("hsrSetting", ({ hsrSetting }) => {
  if (!hsrSetting || !hsrSetting.autoMode) {
    console.log("Auto booking is disabled.");
    return;
  }

  console.log("Start THSR auto booking.", hsrSetting);
  startAutoBooking(hsrSetting);
});

function startAutoBooking(hsrSetting) {
  let reloadScheduled = false;

  const timeMap = {
    "00:00": "1201A",
    "00:30": "1230A",
    "05:00": "500A",
    "05:30": "530A",
    "06:00": "600A",
    "06:30": "630A",
    "07:00": "700A",
    "07:30": "730A",
    "08:00": "800A",
    "08:30": "830A",
    "09:00": "900A",
    "09:30": "930A",
    "10:00": "1000A",
    "10:30": "1030A",
    "11:00": "1100A",
    "11:30": "1130A",
    "12:00": "1200N",
    "12:30": "1230P",
    "13:00": "100P",
    "13:30": "130P",
    "14:00": "200P",
    "14:30": "230P",
    "15:00": "300P",
    "15:30": "330P",
    "16:00": "400P",
    "16:30": "430P",
    "17:00": "500P",
    "17:30": "530P",
    "18:00": "600P",
    "18:30": "630P",
    "19:00": "700P",
    "19:30": "730P",
    "20:00": "800P",
    "20:30": "830P",
    "21:00": "900P",
    "21:30": "930P",
    "22:00": "1000P",
    "22:30": "1030P",
    "23:00": "1100P",
    "23:30": "1130P"
  };

  function toMinutes(timeText) {
    if (!timeText || !/^\d{2}:\d{2}$/.test(timeText)) return null;

    const [hours, minutes] = timeText.split(":").map(Number);
    return (hours * 60) + minutes;
  }

  function applyTHSRTime(uiTime) {
    const value = timeMap[uiTime];
    if (!value) return;

    const select = document.querySelector('select[name="toTimeTable"]');
    if (!select) return;

    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function pickTrainByRange() {
    const radios = Array.from(
      document.querySelectorAll('input[name="TrainQueryDataViewPanel:TrainGroup"]')
    );

    if (!radios.length) return false;

    const earliestMinutes = toMinutes(hsrSetting.time);
    const latestMinutes = toMinutes(hsrSetting.latestTime);

    const matchingRadios = radios.filter((radio) => {
      const departure = radio.getAttribute("querydeparture");
      const departureMinutes = toMinutes(departure);

      if (departureMinutes === null) return false;
      if (earliestMinutes !== null && departureMinutes < earliestMinutes) return false;
      if (latestMinutes !== null && departureMinutes > latestMinutes) return false;

      return true;
    });

    if (!matchingRadios.length) {
      
      console.warn("沒有符合的車次沒有符合的車次.", {
        earliest: hsrSetting.time || null,
        latest: hsrSetting.latestTime || null
      });

      if (!reloadScheduled) {
        reloadScheduled = true;
        
        setTimeout(() => {
          window.location.reload();
        }, 20000);
      }

      return false;
    }

    const targetRadio = matchingRadios[0];
    targetRadio.checked = true;
    targetRadio.dispatchEvent(new Event("click", { bubbles: true }));
    targetRadio.dispatchEvent(new Event("change", { bubbles: true }));

    console.log("Selected train in departure range.", {
      departure: targetRadio.getAttribute("querydeparture"),
      arrival: targetRadio.getAttribute("queryarrival"),
      code: targetRadio.getAttribute("querycode")
    });

    return true;
  }

  const dateForTHSRC = (hsrSetting.date || "").replaceAll("-", "/");

  (function fillSearchForm() {
    const selStart = document.querySelector('select[name="selectStartStation"]');
    if (selStart) {
      selStart.value = hsrSetting.start;
      selStart.dispatchEvent(new Event("change", { bubbles: true }));
    }

    const selDest = document.querySelector('select[name="selectDestinationStation"]');
    if (selDest) {
      selDest.value = hsrSetting.end;
      selDest.dispatchEvent(new Event("change", { bubbles: true }));
    }

    const dateInput = document.querySelector("#toTimeInputField");
    if (dateInput && dateForTHSRC) {
      dateInput.value = dateForTHSRC;
      dateInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    applyTHSRTime(hsrSetting.time);

    const ticketRowMap = {
      F: 0,
      H: 1,
      W: 2,
      E: 3,
      P: 4
    };

    const allTicketSelectors = [
      { sel: 'select[name="ticketPanel:rows:0:ticketAmount"]', code: "F" },
      { sel: 'select[name="ticketPanel:rows:1:ticketAmount"]', code: "H" },
      { sel: 'select[name="ticketPanel:rows:2:ticketAmount"]', code: "W" },
      { sel: 'select[name="ticketPanel:rows:3:ticketAmount"]', code: "E" },
      { sel: 'select[name="ticketPanel:rows:4:ticketAmount"]', code: "P" }
    ];

    allTicketSelectors.forEach(({ sel, code }) => {
      const select = document.querySelector(sel);
      if (!select) return;

      select.value = `0${code}`;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const ticketRow = ticketRowMap[hsrSetting.ticketType];
    if (ticketRow !== undefined) {
      const ticketSelect = document.querySelector(
        `select[name="ticketPanel:rows:${ticketRow}:ticketAmount"]`
      );

      if (ticketSelect) {
        ticketSelect.value = `${hsrSetting.count}${hsrSetting.ticketType}`;
        ticketSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    const secInput = document.querySelector("#securityCode");
    const submitBtn = document.querySelector("#SubmitButton");

    if (secInput && submitBtn) {
      setInterval(() => {
        if (secInput.value.trim() !== "") {
          submitBtn.click();
        }
      }, 20000);
    }

    const waitCaptcha = setInterval(() => {
      const img = document.querySelector("#BookingS1Form_homeCaptcha_passCode");
      if (!img || !img.complete) return;

      clearInterval(waitCaptcha);
      processCaptcha(img);
    }, 200);

    async function processCaptcha(img) {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        try {
          const res = await fetch("http://127.0.0.1:5000/ocr", {
            method: "POST",
            body: blob
          });

          const result = await res.json();
          fillCaptcha(result.code);
        } catch (err) {
          console.error("OCR failed.", err);
        }
      }, "image/png");
    }

    function fillCaptcha(code) {
      const captchaInput = document.querySelector("#securityCode");
      if (!captchaInput) return;

      captchaInput.value = code;
      captchaInput.dispatchEvent(new Event("input", { bubbles: true }));
      captchaInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  })();

  (function handleTrainSelectionStep() {
    const detailInterval = setInterval(() => {
      const trainRadios = document.querySelectorAll('input[name="TrainQueryDataViewPanel:TrainGroup"]');
      const nextBtn = document.querySelector(".ticket-summary input.btn-next[type='submit']");

      if (!trainRadios.length || !nextBtn) return;

      if (!pickTrainByRange()) {
        clearInterval(detailInterval);
        return;
      }

      nextBtn.click();
      clearInterval(detailInterval);
    }, 300);
  })();

  const agree = document.querySelector('input[name="agree"]');
  if (agree) {
    agree.checked = true;
    agree.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const idInput = document.querySelector("#idNumber");
  if (idInput) {
    idInput.value = hsrSetting.p1;
    idInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const phoneInput = document.querySelector("#mobilePhone");
  if (phoneInput) {
    phoneInput.value = "0921885703";
    phoneInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const emailInput = document.querySelector("#email");
  if (emailInput) {
    emailInput.value = "gm9111070@gmail.com";
    emailInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const p1 = document.querySelector(
    "#BookingS3Form_TicketPassengerInfoInputPanel_passengerDataView_0_passengerDataView2_passengerDataIdNumber"
  );
  if (p1) {
    p1.value = hsrSetting.p1;
    p1.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const p2 = document.querySelector(
    "#BookingS3Form_TicketPassengerInfoInputPanel_passengerDataView_1_passengerDataView2_passengerDataIdNumber"
  );
  if (p2) {
    p2.value = hsrSetting.p2;
    p2.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const memberRadio = document.querySelector("#memberSystemRadio1");
  if (memberRadio) {
    memberRadio.checked = true;
    memberRadio.dispatchEvent(new Event("change", { bubbles: true }));
    memberRadio.click();
  }

  setTimeout(() => {
    const msNumber = document.querySelector("#msNumber");
    if (!msNumber) return;

    msNumber.value = "0921885703";
    msNumber.dispatchEvent(new Event("input", { bubbles: true }));
    msNumber.dispatchEvent(new Event("change", { bubbles: true }));
  }, 300);

  (function submitFinalStep() {
    const finalInterval = setInterval(() => {
      const finalBtn = document.querySelector("#isSubmit");
      const msNumber = document.querySelector("#msNumber");

      if (!finalBtn || !msNumber) return;
      if (msNumber.value.trim() === "") return;

      finalBtn.click();
      clearInterval(finalInterval);
    }, 300);
  })();

  (function confirmBooking() {
    const confirmInterval = setInterval(() => {
      const btn = document.querySelector("#btn-custom2");
      if (!btn) return;

      btn.click();
      clearInterval(confirmInterval);
    }, 300);
  })();

  (function notifyWhenDone() {
    const doneInterval = setInterval(() => {
      const pnrEl = document.querySelector(".pnr-code span");
      if (!pnrEl) return;

      if (typeof window.sendDiscordNotification === "function") {
        window.sendDiscordNotification();
      }

      clearInterval(doneInterval);
    }, 2000);
  })();
}
