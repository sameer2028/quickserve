const date = new Date("2026-06-27T13:39:00.000Z");

const istOffset = 5.5 * 60 * 60 * 1000;
const istDate = new Date(date.getTime() + istOffset);

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayString = dayNames[istDate.getUTCDay()];

const currentHour = String(istDate.getUTCHours()).padStart(2, '0');
const currentMinute = String(istDate.getUTCMinutes()).padStart(2, '0');

const currentTime = `${currentHour}:${currentMinute}`;

console.log('Day:', dayString);
console.log('Time:', currentTime);
