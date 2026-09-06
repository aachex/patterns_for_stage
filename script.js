(function () {
  "use strict";

  var GOOGLE_SHEETS_URL =
    "https://script.google.com/macros/s/AKfycbxpho7ceaHq6Oa9CEu-xd9yYhTXV7UDXNZ5RDssqr5BQA0rWYHW-4UjTQV4XrM4pcg/exec";

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
      : "Получить гайд";
  }

  function buildPayload() {
    var fd = new FormData(form);

    return {
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
          "Готово! Гайд уже в пути — проверь почту (включая спам)."
        );

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