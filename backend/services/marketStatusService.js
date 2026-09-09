const { MARKETS } = require("../config/markets");

const getMarketStatus = (exchange) => {
  if (!exchange || exchange === "UNKNOWN") return { status: "UNKNOWN" };

  const now = new Date();

  if (exchange === "NSE" || exchange === "BSE") {
    return calculateStatus(now, MARKETS.INDIA.timezone, 9, 15, 15, 30);
  }

  if (exchange === "NASDAQ" || exchange === "NYSE") {
    return calculateStatus(now, MARKETS.USA.timezone, 9, 30, 16, 0);
  }

  if (exchange === "TSE") {
    // Japan: 09:00-11:30 and 12:30-15:00
    const tokyoTime = getLocalTime(now, MARKETS.JAPAN.timezone);
    const day = tokyoTime.getDay();
    if (day === 0 || day === 6) return { status: "CLOSED", reason: "Weekend" };

    const h = tokyoTime.getHours();
    const m = tokyoTime.getMinutes();
    const time = h * 100 + m;

    if ((time >= 900 && time < 1130) || (time >= 1230 && time < 1500)) {
      return { status: "OPEN" };
    }
    return { status: "CLOSED", reason: "Outside trading hours" };
  }

  if (exchange === "LSE") {
    return calculateStatus(now, MARKETS.UK.timezone, 8, 0, 16, 30);
  }

  return { status: "UNKNOWN" };
};

const getLocalTime = (date, timezone) => {
  // Use Intl to get a timezone-aware date object
  const str = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false
  }).format(date);

  // Parse the formatted string back into a Date for simple comparison
  return new Date(str);
};

const calculateStatus = (date, timezone, openHour, openMin, closeHour, closeMin) => {
  const localTime = getLocalTime(date, timezone);
  const day = localTime.getDay(); // 0=Sunday, 6=Saturday

  if (day === 0 || day === 6) {
    return { status: "CLOSED", reason: "Weekend" };
  }

  const h = localTime.getHours();
  const m = localTime.getMinutes();
  const time = h * 100 + m;
  const openTime = openHour * 100 + openMin;
  const closeTime = closeHour * 100 + closeMin;

  if (time >= openTime && time < closeTime) {
    return { status: "OPEN" };
  }
  if (time < openTime) {
    return { status: "CLOSED", reason: "Pre-market" };
  }
  return { status: "CLOSED", reason: "Post-market" };
};

module.exports = { getMarketStatus };
