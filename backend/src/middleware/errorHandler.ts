import { BAD_REQUEST, CONFLICT, INTERNAL_SERVER_ERROR } from "../constants/http";
import { ErrorRequestHandler, NextFunction, Request, Response } from "express";

import AppError from "../utils/AppError";
import { z } from "zod";

const handleZodError = (res: Response, error: z.ZodError) => {
    const errors = error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message,
    }));

    return res.status(BAD_REQUEST).json({
        message: "Validation Error",
        errors,
    });
};

const handleAppError = (res: Response, error: AppError) => {
    return res.status(error.statusCode).json({
      message: error.message,
      errorCode: error.errorCode,
    });
  };

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
    console.log(`PATH: ${req.path}`, error);

    if (error instanceof z.ZodError) {
        return handleZodError(res, error);
    }


    if (error instanceof AppError) {
        return handleAppError(res, error);
    }
    
    res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error");
};

export default errorHandler;
