
function timeUnit(step, name) {
    return { step, name };
}

const TIME_UNITS = [
    timeUnit(1, 'ms'),
    timeUnit(1000, 'seconds'),
    timeUnit(60, 'minutes'),
    timeUnit(60, 'hours'),
    timeUnit(24, 'days'),
    timeUnit(31, 'months'),
    timeUnit((365 / 31), 'years')
];

const TIME_UNIT_THRESHOLD = 0.95;

module.exports = {
    formatDateTime: (datetime) => {
        const date = (typeof datetime === 'number') ? new Date(datetime) : datetime;

        const dateStr = `${date.getFullYear()}`
            + `-${(date.getMonth() + 1).toString().padStart(2, '0')}`
            + `-${(date.getDate()).toString().padStart(2, '0')}`;
        const timeStr = `${date.getHours().toString().padStart(2, '0')}`
            + `:${date.getMinutes().toString().padStart(2, '0')}`
            + `:${date.getSeconds().toString().padStart(2, '0')}`
            + `.${date.getMilliseconds().toString().padStart(3, '0')}`;

        return `${dateStr} ${timeStr}`;
    },

    formatDuration: (millis) => {
        if (millis < 0) {
            return 'unknown';
        }

        let remaining = millis;
        let nextUnitIndex = 1;
        while(nextUnitIndex < TIME_UNITS.length &&
                remaining / TIME_UNITS[nextUnitIndex].step >= TIME_UNIT_THRESHOLD) {
            remaining = remaining / TIME_UNITS[nextUnitIndex].step;
            nextUnitIndex++;
        }

        return `${remaining.toFixed(1)} ${TIME_UNITS[nextUnitIndex - 1].name}`
    },
};