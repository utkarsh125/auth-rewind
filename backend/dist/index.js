"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ENTRY POINT OF THE APPLICATION
require("dotenv/config");
const env_1 = require("./constants/env");
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const authenticate_1 = __importDefault(require("./middleware/authenticate"));
const db_1 = __importDefault(require("./config/db"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const express_1 = __importDefault(require("express"));
const session_route_1 = __importDefault(require("./routes/session.route"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: env_1.APP_ORIGIN,
    credentials: true,
}));
// Cookie parser
app.use((0, cookie_parser_1.default)());
// Define route with catchErrors
// app.get(
//     "/",
//     catchErrors(async (req, res, next) => {
//         throw new Error("Test Error"); // This will be caught by catchErrors
//         return res.status(200).json({
//             status: "Healthy",
//         });
//     })
// );
app.get("/", (req, res, next) => {
    return res.status(200).json({
        status: "Healthy",
    });
});
//USER ROUTES
app.use("/auth", auth_route_1.default);
//Protected Routes
app.use("/user", authenticate_1.default, user_route_1.default);
app.use("/sessions", authenticate_1.default, session_route_1.default);
//AUTH ROUTES
app.use("/auth", auth_route_1.default);
// Error handler middleware
app.use(errorHandler_1.default);
app.listen(env_1.PORT, async () => {
    console.log(`Listening on port ${env_1.PORT} in ${env_1.NODE_ENV} environment.`);
    await (0, db_1.default)();
});
