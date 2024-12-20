import express, { NextFunction, urlencoded } from "express";
import path from "path";
import fileUpload from "express-fileupload";
import http from "http";
import mongoose from "mongoose";
import morgan from "morgan";
import { Request, Response } from "express";
import userRoutes from "./routes/users";
import cors from "cors";
import cookieParser from "cookie-parser";
import recipesRoutes from "./routes/recipes";
import stepRoutes from "./routes/steps";
import tagRoutes from "./routes/tags";
import commentRoutes from "./routes/comments";
import SocketServer from "./classes/SocketServer";
import reportRoutes from "./routes/reports";
import adminGeneralRoutes from "./routes/admin/general";
import adminReportRoutes from "./routes/admin/reports";
import adminCommentRoutes from "./routes/admin/comments";
import adminRecipeRoutes from "./routes/admin/recipes";
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

// user routes ---
app.use("/api/users", userRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/steps", stepRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/reports", reportRoutes);

// admin routes
app.use('/api/admin/', adminGeneralRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/comments', adminCommentRoutes);
app.use('/api/admin/recipes', adminRecipeRoutes);

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
new SocketServer(server); // web sockets

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
