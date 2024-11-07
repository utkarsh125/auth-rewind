"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ONE_DAY_MS = exports.oneHourNow = exports.fiveMinutesAgo = exports.fifteenMinutesFromNow = exports.thirtyDaysFromNow = exports.oneYearFromNow = void 0;
const oneYearFromNow = () => {
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 //One year from now value in miliseconds
    );
};
exports.oneYearFromNow = oneYearFromNow;
const thirtyDaysFromNow = () => {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
};
exports.thirtyDaysFromNow = thirtyDaysFromNow;
const fifteenMinutesFromNow = () => {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
};
exports.fifteenMinutesFromNow = fifteenMinutesFromNow;
const fiveMinutesAgo = () => new Date(Date.now() - 5 * 60 * 1000);
exports.fiveMinutesAgo = fiveMinutesAgo;
const oneHourNow = () => new Date(Date.now() + 60 * 60 * 1000);
exports.oneHourNow = oneHourNow;
exports.ONE_DAY_MS = 24 * 60 * 60 * 1000;
