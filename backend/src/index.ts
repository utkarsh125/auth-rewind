// ENTRY POINT OF THE APPLICATION
import "dotenv/config";

import { APP_ORIGIN, NODE_ENV, PORT } from "./constants/env";
import { NextFunction, Request, Response } from "express";

import authRoutes from "./routes/auth.route";
import authenticate from "./middleware/authenticate";
import catchErrors from "./utils/catchErrors";
import connectToDatabase from "./config/db";
import cookieParser from "cookie-parser";
import cors from "cors";
import errorHandler from "./middleware/errorHandler";
import express from "express";
import sessionRoutes from "./routes/session.route";
import userRoutes from "./routes/user.route";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: APP_ORIGIN,
        credentials: true,
    })
);

// Cookie parser
app.use(cookieParser());

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
    })
})

//USER ROUTES
app.use("/auth", authRoutes);

//Protected Routes
app.use("/user", authenticate, userRoutes)
app.use("/sessions", authenticate, sessionRoutes);

//AUTH ROUTES
app.use("/auth", authRoutes)

// Error handler middleware
app.use(errorHandler);

app.listen(PORT, async () => {
    console.log(`Listening on port ${PORT} in ${NODE_ENV} environment.`);
    await connectToDatabase();
});
