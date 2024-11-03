import { Router } from "express";
import { registerhandler } from "../controller/auth.controller";

const authRoutes = Router();


//prefix: auth
authRoutes.post("/register", registerhandler)

export default authRoutes;