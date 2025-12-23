import {createServer} from "node:http";
import {Server} from "socket.io";
import {io as Client} from "socket.io-client";
import jwt from "jsonwebtoken";

process.env.SECRET_KEY = "test_secret_key";

describe("WebSocket Server", () => {
    let io, server, clientSocket;
    const PORT = 3001;
    const SECRET_KEY = "test_secret_key";

    beforeAll((done) => {
        const httpServer = createServer();
        io = new Server(httpServer);

        io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Authentication error"));
            }
            jwt.verify(token, SECRET_KEY, (err, decoded) => {
                if (err) return next(new Error("Authentication error"));
                (socket as any).user = decoded;
                next();
            });
        });

        io.on("connection", (socket) => {
            socket.on("join_room", (roomId) => {
                socket.join(`room:${roomId}`);
            });
        });

        server = httpServer.listen(PORT, () => {
            done();
        });
    });

    afterAll(() => {
        io.close();
        server.close();
    });

    afterEach(() => {
        if (clientSocket) {
            clientSocket.close();
        }
    });

    test("should allow connection with valid token", (done) => {
        const token = jwt.sign({sub: "user-123"}, SECRET_KEY);
        clientSocket = Client(`http://localhost:${PORT}`, {
            auth: {token}
        });

        clientSocket.on("connect", () => {
            expect(clientSocket.connected).toBe(true);
            done();
        });
    });

    test("should reject connection without token", (done) => {
        clientSocket = Client(`http://localhost:${PORT}`);

        clientSocket.on("connect_error", (err) => {
            expect(err.message).toBe("Authentication error");
            done();
        });
    });

    test("should reject connection with invalid token", (done) => {
        clientSocket = Client(`http://localhost:${PORT}`, {
            auth: {token: "invalid-token"}
        });

        clientSocket.on("connect_error", (err) => {
            expect(err.message).toBe("Authentication error");
            done();
        });
    });

    test("should join a room", (done) => {
        const token = jwt.sign({sub: "user-123"}, SECRET_KEY);
        clientSocket = Client(`http://localhost:${PORT}`, {
            auth: {token}
        });

        clientSocket.on("connect", () => {
            clientSocket.emit("join_room", "room-1");

            setTimeout(() => {
                const socketId = clientSocket.id;
                const rooms = io.sockets.adapter.socketRooms(socketId);
                expect(rooms).toBeDefined();
                expect(rooms.has("room:room-1")).toBe(true);
                done();
            }, 50);
        });
    });
});
