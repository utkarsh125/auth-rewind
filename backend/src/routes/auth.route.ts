import { loginHandler, logoutHandler, refreshHandler, registerHandler } from "../controller/auth.controller";

import { Router } from "express";

const authRoutes = Router();


//prefix: auth
authRoutes.post("/register", registerHandler)
authRoutes.post("/login", loginHandler)
authRoutes.get("/refresh", refreshHandler)
authRoutes.get("/logout", logoutHandler)
// authRoutes.get("/email/verify/:code", verifyEmailHandler)


export default authRoutes;