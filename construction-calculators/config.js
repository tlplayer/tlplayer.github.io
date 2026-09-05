// Advertising and retailer search settings.
window.CONSTRUCTION_CALCULATORS_CONFIG = {
    adsenseClient: "ca-pub-7010590645085744",
    displayAdSlot: "",
    amazonTrackingTag: "buildestimato-20"
};

window.amazonSearch = function (query) {
    return "https://www.amazon.com/s?k=" + encodeURIComponent(query) +
        "&tag=" + encodeURIComponent(window.CONSTRUCTION_CALCULATORS_CONFIG.amazonTrackingTag);
};
