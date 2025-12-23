import {createServer} from "node:http";
import next from "next";
import {Server} from "socket.io";
import jwt from "jsonwebtoken";

const dev = process.env.ENVIRONMENT !== "production";
const hostname = "localhost";
const port = parseInt(process.env.APP_PORT || "8001", 10);
const SECRET_KEY = process.env.SECRET_KEY || "dev_secret_key";

const app = next({dev, hostname, port});
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    (global as any).io = io;

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }
        jwt.verify(token, SECRET_KEY, (err: any, decoded: any) => {
            if (err) return next(new Error("Authentication error"));
            (socket as any).user = decoded;
            next();
        });
    });

    io.on("connection", (socket) => {
        const user = (socket as any).user;
        console.log("Client connected:", socket.id, user?.sub);

        if (user?.sub) {
            socket.join(`user:${user.sub}`);
            console.log(`User ${user.sub} joined personal channel`);
        }

        socket.on("join_room", (roomId: string) => {
            console.log(`User ${user?.sub} joining room ${roomId}`);
            socket.join(`room:${roomId}`);
        });

        socket.on("leave_room", (roomId: string) => {
            console.log(`User ${user?.sub} leaving room ${roomId}`);
            socket.leave(`room:${roomId}`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
