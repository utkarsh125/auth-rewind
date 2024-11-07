"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Date_1 = require("../utils/Date");
const sessionSchema = new mongoose_1.default.Schema({
    userId: {
        ref: "User",
        type: mongoose_1.default.Schema.Types.ObjectId,
        index: true,
    },
    userAgent: { type: String },
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, default: Date_1.thirtyDaysFromNow }
});
const SessionModel = mongoose_1.default.model("Session", sessionSchema);
exports.default = SessionModel;
