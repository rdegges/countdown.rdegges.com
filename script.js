const TIME_ZONE = "America/Los_Angeles";
const TARGET = makeZonedDate({
  year: 2026,
  month: 3,
  day: 13,
  hour: 17,
  minute: 0,
  second: 0,
});
const START = makeZonedDate({
  year: 2019,
  month: 9,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
});

const countdownEls = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
};

const tenureEls = {
  years: document.getElementById("tenure-years"),
  months: document.getElementById("tenure-months"),
  days: document.getElementById("tenure-days"),
  hours: document.getElementById("tenure-hours"),
  minutes: document.getElementById("tenure-minutes"),
  seconds: document.getElementById("tenure-seconds"),
};

const totalEls = {
  years: document.getElementById("total-years"),
  months: document.getElementById("total-months"),
  days: document.getElementById("total-days"),
  hours: document.getElementById("total-hours"),
  minutes: document.getElementById("total-minutes"),
  seconds: document.getElementById("total-seconds"),
};

const statusEl = document.getElementById("status");
const targetDateEl = document.getElementById("target-date");

const totalDiff = calendarDiff(START, TARGET, TIME_ZONE);
updateDuration(totalDiff, totalEls);

targetDateEl.textContent = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  dateStyle: "full",
  timeStyle: "short",
}).format(TARGET);

initCarousel();

tick();
setInterval(tick, 1000);

function tick() {
  const now = new Date();
  updateCountdown(now);
  updateTenure(now);
}

function updateCountdown(now) {
  const diffMs = TARGET.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  countdownEls.days.textContent = formatNumber(days);
  countdownEls.hours.textContent = pad(hours);
  countdownEls.minutes.textContent = pad(minutes);
  countdownEls.seconds.textContent = pad(seconds);

  if (diffMs <= 0) {
    document.body.classList.add("done");
    statusEl.textContent = "She's free!";
  } else {
    document.body.classList.remove("done");
    statusEl.textContent = "Almost there. Cue the confetti.";
  }
}

function updateTenure(now) {
  if (now < START) {
    updateDuration(emptyDuration(), tenureEls);
    return;
  }

  const diff = calendarDiff(START, now, TIME_ZONE);
  updateDuration(diff, tenureEls);
}

function updateDuration(diff, elements) {
  elements.years.textContent = diff.years;
  elements.months.textContent = diff.months;
  elements.days.textContent = diff.days;
  elements.hours.textContent = diff.hours;
  elements.minutes.textContent = diff.minutes;
  elements.seconds.textContent = diff.seconds;
}

function calendarDiff(start, end, timeZone) {
  if (end.getTime() < start.getTime()) {
    return emptyDuration();
  }

  const startParts = getParts(start, timeZone);
  const endParts = getParts(end, timeZone);

  let carryYear = endParts.year;
  let carryMonth = endParts.month;
  let carryDay = endParts.day;
  let carryHour = endParts.hour;
  let carryMinute = endParts.minute;
  let carrySecond = endParts.second;

  if (carrySecond < startParts.second) {
    carrySecond += 60;
    carryMinute -= 1;
  }

  if (carryMinute < startParts.minute) {
    carryMinute += 60;
    carryHour -= 1;
  }

  if (carryHour < startParts.hour) {
    carryHour += 24;
    carryDay -= 1;
  }

  if (carryDay < startParts.day) {
    carryMonth -= 1;
    if (carryMonth < 1) {
      carryMonth = 12;
      carryYear -= 1;
    }
    carryDay += daysInMonth(carryYear, carryMonth);
  }

  if (carryMonth < startParts.month) {
    carryMonth += 12;
    carryYear -= 1;
  }

  return {
    years: Math.max(0, carryYear - startParts.year),
    months: Math.max(0, carryMonth - startParts.month),
    days: Math.max(0, carryDay - startParts.day),
    hours: Math.max(0, carryHour - startParts.hour),
    minutes: Math.max(0, carryMinute - startParts.minute),
    seconds: Math.max(0, carrySecond - startParts.second),
  };
}

function getParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const lookup = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  }

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
}

function makeZonedDate({ year, month, day, hour, minute, second }) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, TIME_ZONE);
  return new Date(utcGuess.getTime() - offsetMinutes * 60000);
}

function getTimeZoneOffsetMinutes(date, timeZone) {
  const parts = getParts(date, timeZone);
  const utcDate = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return (utcDate - date.getTime()) / 60000;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatNumber(value) {
  return Number(value).toLocaleString("en-US");
}

function emptyDuration() {
  return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
}

function initCarousel() {
  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) {
    return;
  }

  const track = carousel.querySelector(".carousel-track");
  const slides = Array.from(track.querySelectorAll(".carousel-slide"));
  const prevButton = carousel.querySelector("[data-action='prev']");
  const nextButton = carousel.querySelector("[data-action='next']");
  const dotsContainer = carousel.parentElement.querySelector("[data-dots]");

  if (slides.length === 0 || !dotsContainer) {
    return;
  }

  let currentIndex = slides.findIndex((slide) =>
    slide.classList.contains("is-active")
  );
  if (currentIndex < 0) {
    currentIndex = 0;
    slides[0].classList.add("is-active");
  }

  const dots = slides.map((slide, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Go to memory ${index + 1}`);
    button.classList.toggle("is-active", index === currentIndex);
    button.addEventListener("click", () => {
      setActive(index);
      restartAutoAdvance();
    });
    dotsContainer.appendChild(button);
    return button;
  });

  function setActive(index) {
    slides[currentIndex].classList.remove("is-active");
    dots[currentIndex].classList.remove("is-active");

    currentIndex = (index + slides.length) % slides.length;

    slides[currentIndex].classList.add("is-active");
    dots[currentIndex].classList.add("is-active");
  }

  function goNext() {
    setActive(currentIndex + 1);
  }

  function goPrev() {
    setActive(currentIndex - 1);
  }

  prevButton?.addEventListener("click", () => {
    goPrev();
    restartAutoAdvance();
  });

  nextButton?.addEventListener("click", () => {
    goNext();
    restartAutoAdvance();
  });

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  let autoAdvanceId = null;

  function startAutoAdvance() {
    if (prefersReducedMotion || slides.length < 2) {
      return;
    }
    autoAdvanceId = window.setInterval(goNext, 6500);
  }

  function stopAutoAdvance() {
    if (autoAdvanceId) {
      window.clearInterval(autoAdvanceId);
      autoAdvanceId = null;
    }
  }

  function restartAutoAdvance() {
    stopAutoAdvance();
    startAutoAdvance();
  }

  carousel.addEventListener("pointerenter", stopAutoAdvance);
  carousel.addEventListener("pointerleave", startAutoAdvance);
  carousel.addEventListener("focusin", stopAutoAdvance);
  carousel.addEventListener("focusout", startAutoAdvance);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoAdvance();
    } else {
      startAutoAdvance();
    }
  });

  startAutoAdvance();
}
