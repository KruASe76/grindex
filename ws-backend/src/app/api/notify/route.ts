import {NextResponse} from 'next/server';
import {Server} from 'socket.io';

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');
    const SECRET_KEY = process.env.SECRET_KEY;

    if (!SECRET_KEY) {
        throw new Error("SECRET_KEY is missing");
    }

    if (authHeader !== `Bearer ${SECRET_KEY}`) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    try {
        const body = await req.json();
        const updates = Array.isArray(body) ? body : [body];

        const io: Server = (global as any).io;
        if (!io) {
            return NextResponse.json({error: 'Socket server not initialized'}, {status: 503});
        }

        let broadcastCount = 0;
        for (const update of updates) {
            const {userId, roomId, objectiveId, live, startTime} = update;
            if (roomId && userId) {
                io.to(`room:${roomId}`).emit('live_status_update', {userId, roomId, objectiveId, live, startTime});
                broadcastCount++;
            } else if (userId) {
                io.to(`user:${userId}`).emit('live_status_update', {
                    userId,
                    roomId: null,
                    objectiveId: null,
                    live,
                    startTime
                });
                broadcastCount++;
            }
        }

        return NextResponse.json({success: true, broadcastCount});
    } catch (e) {
        console.error("Error processing notification:", e);
        return NextResponse.json({error: 'Internal Server Error'}, {status: 500});
    }
}
