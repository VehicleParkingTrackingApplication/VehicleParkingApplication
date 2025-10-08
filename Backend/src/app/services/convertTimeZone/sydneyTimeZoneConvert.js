// src/app/services/convertTimeZone/sydneyTimeZoneConvert.js
const SYDNEY_TZ = 'Australia/Sydney';

const BASE = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
};

/**
 * Format a Date in Australia/Sydney timezone.
 * @param {Date} date - e.g., new Date()
 * @returns {string} e.g., "16/09/2025, 10:23:45"
 */
export function formatSydney(date) {
    return new Intl.DateTimeFormat('en-AU', { timeZone: SYDNEY_TZ, ...BASE }).format(date);
}

/**
 * Get the current time formatted in Australia/Sydney timezone.
 * @returns {string} e.g., "16/09/2025, 10:23:45"
 */
export function formatSydneyNow() {
    return formatSydney(new Date());
}

/**
 * ISO-like string in Australia/Sydney timezone with offset (good for logs).
 * @param {Date} date
 * @returns {string} e.g., "2025-09-16T10:23:45+10:00" (handles DST)
 */
export function toSydneyISO(date) {
    const parts = new Intl.DateTimeFormat('en-AU', { timeZone: SYDNEY_TZ, ...BASE }).formatToParts(date);
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const offsetMin = getSydneyOffsetMinutes(date);
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}${sign}${hh}:${mm}`;
}

function getOffsetMinutes(date, timeZone) {
    const base = { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false };
    const tzParts = new Intl.DateTimeFormat('en-AU', { timeZone, ...base }).formatToParts(date);
    const tz = Object.fromEntries(tzParts.map(p => [p.type, p.value]));
    const utcParts = new Intl.DateTimeFormat('en-AU', { timeZone: 'UTC', ...base }).formatToParts(date);
    const u = Object.fromEntries(utcParts.map(p => [p.type, p.value]));
    const toMin = (y,m,d,h,mi,s) => Math.floor(Date.UTC(+y, +m - 1, +d, +h, +mi, +s) / 60000);
    return toMin(tz.year,tz.month,tz.day,tz.hour,tz.minute,tz.second) - toMin(u.year,u.month,u.day,u.hour,u.minute,u.second);
}

// Returns a new Date whose ISO ends with Z but shows Sydney wall-clock (changes the instant)
export function convertToTimeZone(date, timeZone) {
    const offsetMin = getOffsetMinutes(date, timeZone); // +600 or +660 with DST
    // console.log("CHECK ", date, timeZone, offsetMin, new Date(date.getTime() + offsetMin * 60000));
    return new Date(date.getTime() + offsetMin * 60000);
}