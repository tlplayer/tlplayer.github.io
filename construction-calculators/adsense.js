(function () {
    "use strict";

    var config = window.CONSTRUCTION_CALCULATORS_CONFIG || {};
    var clientIsValid = /^ca-pub-\d{16}$/.test(config.adsenseClient || "");
    var slotIsValid = /^\d+$/.test(config.displayAdSlot || "");

    if (!clientIsValid) return;

    var script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(config.adsenseClient);
    document.head.appendChild(script);

    if (!slotIsValid) return;

    window.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll("[data-ad-unit]").forEach(function (container) {
            var ad = document.createElement("ins");
            ad.className = "adsbygoogle";
            ad.style.display = "block";
            ad.dataset.adClient = config.adsenseClient;
            ad.dataset.adSlot = config.displayAdSlot;
            ad.dataset.adFormat = "auto";
            ad.dataset.fullWidthResponsive = "true";
            container.replaceChildren(ad);
            container.classList.add("is-ready");
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        });
    });
}());
