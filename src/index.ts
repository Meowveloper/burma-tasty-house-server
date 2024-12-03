import express, { NextFunction, urlencoded } from "express";
import path from "path";
import fileUpload from "express-fileupload";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import morgan from "morgan";
import { Request, Response } from "express";
import userRoutes from "./routes/users";
import cors from "cors";
import cookieParser from "cookie-parser";
import recipesRoutes from "./routes/recipes";
import stepRoutes from "./routes/steps";
import tagRoutes from "./routes/tags";
import Comment from "./models/Comment";
import commentRoutes from "./routes/comments";
require("dotenv/config");

const app = express();


app.use(express.json()); // to manage json format
app.use(urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public"))); // to serve static files in the public folder
app.use(
    fileUpload({
        createParentPath: true,
        limits: { fileSize: 100 * 1024 * 1024 },
        useTempFiles: true,
        tempFileDir: "/tmp/",
    })
);
app.use(morgan("dev"));

app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN,
        credentials: true,
    })
); // to prevent cors error
app.use(cookieParser()); // to manage cookies

// routes ---
app.use("/api/users", userRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/steps", stepRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/comments", commentRoutes);

app.get("/", (req: Request, res: Response) => {
    res.json("hello world from burma-tasty-house");
});
// routes end ---

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack); // Log the error
    res.status(500).json({ error: err.message }); // Send error message
});

const databaseUrl = process.env.ENVIRONMENT == "production" ? process.env.MONGO_URL_PRODUCTION! : process.env.MONGO_URL!;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_ORIGIN,
        credentials: true,
    },
});

// socket.io for comments

io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("postComment", async (data) => {
        console.log("new comment", data);
        const comment = await Comment.store_with_socket(data);

        io.emit("newComment", comment);
    });
});

mongoose
    .connect(databaseUrl)
    .then(() => {
        console.log(process.env.ENVIRONMENT !== "production" ? 'Connected to database "burma-tasty-house"..' : 'Connected to database "burma-tasty-house-production"..');
        const port = process.env.PORT || 8000;
        server.listen(port, () => {
            console.log("App is running on port : " + process.env.PORT);
        });
    })
    .catch(err => {
        console.log("database connection error", err);
    });
