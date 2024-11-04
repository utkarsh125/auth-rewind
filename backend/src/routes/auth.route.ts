import { loginHandler, registerHandler } from "../controller/auth.controller";

import { Router } from "express";

const authRoutes = Router();


//prefix: auth
authRoutes.post("/register", registerHandler)
authRoutes.post("/login", loginHandler)

export default authRoutes;