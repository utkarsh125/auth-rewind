"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const session_controller_1 = require("../controller/session.controller");
const express_1 = require("express");
const sessionRoutes = (0, express_1.Router)();
//prefix: /sessions
sessionRoutes.get("/", session_controller_1.getSessionHandler);
sessionRoutes.delete("/:id", session_controller_1.deleteSessionHandler);
exports.default = sessionRoutes;
