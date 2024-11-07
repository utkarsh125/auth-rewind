import { deleteSessionHandler, getSessionHandler } from "../controller/session.controller";

import { Router } from "express";

const sessionRoutes = Router();

//prefix: /sessions

sessionRoutes.get("/", getSessionHandler);
sessionRoutes.delete("/:id", deleteSessionHandler)

export default sessionRoutes