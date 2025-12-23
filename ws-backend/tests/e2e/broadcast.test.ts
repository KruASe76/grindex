import {io as Client, Socket} from "socket.io-client";
import jwt from "jsonwebtoken";
import {ChildProcess, spawn} from "child_process";
import path from "path";

const APP_PORT = 3002;
const SECRET_KEY = "e2e_secret_key";

describe("WebSocket Broadcast E2E", () => {
    let serverProcess: ChildProcess;
    let clientSocket: Socket;

    beforeAll((done) => {
        const serverPath = path.resolve(__dirname, "../../server.ts");

        serverProcess = spawn("./node_modules/.bin/tsx", [serverPath], {
            env: {
                ...process.env,
                APP_PORT: APP_PORT.toString(),
                SECRET_KEY: SECRET_KEY,
                ENVIRONMENT: "test"
            },
            cwd: path.resolve(__dirname, "../../"),
        });

        let started = false;
        serverProcess.stdout?.on("data", (data) => {
            const output = data.toString();
            if (output.includes("Ready on") && !started) {
                started = true;
                done();
            }
        });

        serverProcess.stderr?.on("data", (data) => {
            console.error("Server stderr:", data.toString());
        });
    }, 30000);

    afterAll(() => {
        if (clientSocket) {
            clientSocket.close();
        }
        if (serverProcess) {
            serverProcess.kill();
        }
    });

    test("client should receive broadcast after API call", (done) => {
        const userId = "user-e2e-1";
        const roomId = "room-e2e-1";
        const token = jwt.sign({sub: userId}, SECRET_KEY);

        clientSocket = Client(`http://localhost:${APP_PORT}`, {
            auth: {token},
        });

        clientSocket.on("connect", () => {
            clientSocket.emit("join_room", roomId);

            setTimeout(async () => {
                const payload = {
                    userId,
                    roomId,
                    objectiveId: "obj-1",
                    live: true,
                    startTime: new Date().toISOString()
                };

                try {
                    const res = await fetch(`http://localhost:${APP_PORT}/api/notify`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${SECRET_KEY}`
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!res.ok) {
                        const text = await res.text();
                        throw new Error(`API call failed: ${res.status} ${text}`);
                    }

                    const data = await res.json();
                    expect(data.success).toBe(true);
                    expect(data.broadcastCount).toBe(1);

                } catch (e) {
                    done(e);
                }
            }, 500);
        });

        // verify broadcast received
        clientSocket.on("live_status_update", (data) => {
            expect(data.roomId).toBe(roomId);
            expect(data.userId).toBe(userId);
            expect(data.live).toBe(true);
            done();
        });

        clientSocket.on("connect_error", (err) => {
            done(err);
        });
    }, 10000);
});
