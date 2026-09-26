(function () {
  "use strict";

  var GOOGLE_SHEETS_URL =
    "https://script.google.com/macros/s/AKfycbyWmnK6icV7uUeoyddR5fu2riUDThk9u00dRdbDqWIjgD6t_GCjUJbKhPOL91QGpS4/exec";

  var form = document.getElementById("lead-form");
  var statusEl = document.getElementById("form-status");
  var submitBtn = document.getElementById("submit-btn");

  var emailInput = document.getElementById("email");

  if (!form) return;

  function showStatus(type, message) {
    statusEl.className = "form-status " + type;
    statusEl.textContent = message;
  }

  function validate() {
    emailInput.classList.remove("invalid");

    var email = emailInput.value.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.classList.add("invalid");
      return false;
    }

    return true;
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading
      ? "Отправляем..."
      : "Получить бесплатную главу";
  }

  function buildPayload() {
    var fd = new FormData(form);

    return {
      name: (fd.get("name") || "").toString().trim(),
      email: (fd.get("email") || "").toString().trim()
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

  function focusEmail() {
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () {
      emailInput.focus({ preventScroll: true });
    }, 500);
  }

  var scrollTriggers = document.querySelectorAll(".js-scroll-form");
  for (var i = 0; i < scrollTriggers.length; i++) {
    scrollTriggers[i].addEventListener("click", focusEmail);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    showStatus("", "");

    if (!validate()) {
      showStatus("err", "Проверь корректность email.");
      return;
    }

    setLoading(true);

    var payload = buildPayload();

    jsonp(GOOGLE_SHEETS_URL, payload, function (res) {
      setLoading(false);

      if (res && res.result === "ok") {
        showStatus(
          "ok",
          "Спасибо! Прислали главу тебе на почту (не забудь проверить спам)."
        );

        if (typeof window.ym === "function") {
          window.ym(112363676, "reachGoal", "lead_submit");
        }

        form.reset();
      } else {
        showStatus(
          "err",
          "Ошибка: " +
            (res && res.message
              ? res.message
              : "неизвестная ошибка")
        );
      }
    });
  });
})();