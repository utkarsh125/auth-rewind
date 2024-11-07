import { NOT_FOUND, OK } from "../constants/http";

import SessionModel from "../models/session.model";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";
import { z } from "zod";

export const getSessionHandler = catchErrors(
    async (req, res) => {
        const sessions = await SessionModel.find(
            {
                userId: req.userId,
                expiresAt: { $gt: new Date() },
            },
            {
                _id: 1,
                userAgent: 1,
                createdAt: 1,
            },
            {
                sort: { createdAt: -1 },
            }
        );

        const formattedSessions = sessions.map((session) => ({
            ...session.toObject(),
            isCurrent: session.id === req.sessionId,
        }));

        return res.status(200).json(formattedSessions);
    }
);


export const deleteSessionHandler = catchErrors(
    async(req, res) => {
        const sessionId = z.string().parse(req.params.id);
        const deleted = await SessionModel.findOneAndDelete({
            _id: sessionId,
            userId: req.userId,
        })

        appAssert(deleted, NOT_FOUND, "Session not found")

        return res.status(OK).json({
            message: "Session deleted"
        })
    }
)