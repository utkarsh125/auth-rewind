import { Router } from "express";
import { getSessionHandler } from "../controller/session.controller";

const sessionRoutes = Router();

//prefix: /sessions

sessionRoutes.get("/", getSessionHandler);

export default sessionRoutes