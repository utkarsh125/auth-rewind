import SessionModel from "../models/session.model";
import catchErrors from "../utils/catchErrors";

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
