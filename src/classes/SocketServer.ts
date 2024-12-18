import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import Comment from "../models/Comment";
require("dotenv/config");

class SocketServer {
    private io: Server;

    constructor(server: HttpServer) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_ORIGIN,
                credentials: true,
            },
        });

        this.initializeEventHandlers();
    }

    private initializeEventHandlers() {
        this.io.on("connection", socket => {
            console.log("a user connected");

            // post comment
            this.handlePostComment(socket);
            // post comment end
        });
    }



    private handlePostComment(socket: Socket) {
        socket.on("postComment", async (data: any) => {
            try {
                const comment = await Comment.store_with_socket(data);
                this.io.emit("newComment", comment);
            } catch (error) {
                console.error(error);
            }
        });
    }


    
}

export default SocketServer;
