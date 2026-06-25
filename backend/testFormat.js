const date = new Date();
const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23'
}).formatToParts(date);

console.log(parts);

const hourPart = parts.find(p => p.type === 'hour').value;
const minutePart = parts.find(p => p.type === 'minute').value;

const currentHour = String(hourPart).padStart(2, '0');
const currentMinute = String(minutePart).padStart(2, '0');

console.log('Hour:', currentHour);
console.log('Minute:', currentMinute);
console.log('Time:', `${currentHour}:${currentMinute}`);
