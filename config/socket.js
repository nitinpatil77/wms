import { Server } from "socket.io";

export const io = new Server({
    cors: { origin: "*" }
});

export const initializeSocket = (server) => {
    io.attach(server);
    console.log("Socket.io initialized");

    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};
