(function () {
  "use strict";

  var GOOGLE_SHEETS_URL =
    "https://script.google.com/macros/s/AKfycbye8lGgydIn3lhJT4nxuIZsHz4iI3Q0sounQIPA2hgYFuUq_ybV4KpZeMBjN4Dh71w/exec";

  var leadForm = document.getElementById("lead-form");
  var leadStatus = document.getElementById("form-status");
  var leadBtn = document.getElementById("submit-btn");
  var leadEmail = document.getElementById("email");
  var formDone = document.getElementById("form-done");

  var LEAD_BTN_LABEL = leadBtn ? leadBtn.textContent : "";

  function showStatus(el, type, message) {
    if (!el) return;
    el.className = "form-status " + type;
    el.textContent = message;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function bindValid(input) {
    if (!input) return;
    input.addEventListener("input", function () {
      input.classList.remove("invalid");
    });
  }

  function setLoading(btn, loading, idleLabel) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? "Отправляем..." : idleLabel;
  }

  function buildPayload(email) {
    return {
      email: email
    };
  }

  function jsonp(url, params, callback) {
    var callbackName =
      "callback_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 100000);

    var script = document.createElement("script");

    var query = new URLSearchParams(params);

    query.append("callback", callbackName);

    window[callbackName] = function (data) {
      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      clearTimeout(timeout);

      callback(data);
    };

    script.src = url + "?" + query.toString();

    script.onerror = function () {
      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      clearTimeout(timeout);

      callback({
        result: "error",
        message: "Не удалось связаться с сервером"
      });
    };

    document.head.appendChild(script);

    var timeout = setTimeout(function () {
      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      callback({
        result: "error",
        message: "Таймаут сервера"
      });
    }, 20000);
  }

  var scrollTarget = leadForm ? leadForm.parentNode : null;

  function bindScrollTriggers() {
    var triggers = document.querySelectorAll(".js-scroll-form");
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener("click", function () {
        if (scrollTarget) {
          scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }

  bindScrollTriggers();

  bindValid(leadEmail);

  if (leadForm) {
    leadForm.addEventListener("submit", function (e) {
      e.preventDefault();

      showStatus(leadStatus, "", "");

      if (!isValidEmail(leadEmail.value.trim())) {
        leadEmail.classList.add("invalid");
        showStatus(leadStatus, "err", "Проверь корректность email.");
        return;
      }

      setLoading(leadBtn, true, LEAD_BTN_LABEL);

      var email = leadEmail.value.trim();

      jsonp(GOOGLE_SHEETS_URL, buildPayload(email), function (res) {
        setLoading(leadBtn, false, LEAD_BTN_LABEL);

        if (res && res.result === "ok") {
          leadForm.hidden = true;
          formDone.hidden = false;

          if (typeof window.ym === "function") {
            window.ym(112363676, "reachGoal", "lead_submit");
          }
        } else {
          showStatus(
            leadStatus,
            "err",
            "Ошибка: " +
              (res && res.message
                ? res.message
                : "неизвестная ошибка")
          );
        }
      });
    });
  }
})();