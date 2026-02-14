import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { llm_response, SQL_Generator } from './llm'
import { prisma } from "./prisma";
// import { logger } from "./utils/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

interface ConversationMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

const history: ConversationMessage[] = [];

app.get("/", async (req, res) => {
    // const result = await prisma.$queryRaw`SELECT \"loanStatus\", AVG(\"netApprovedAmount\") AS \"averageLoanAmount\" \nFROM \"loan_transactions\" \nGROUP BY \"loanStatus\";`
    // logger.info("Result : ", result)
    console.log("Running fine.")
    res.send("SQL Chatbot API is running!");
});

app.post("/api/chat", async (req: Request, res: Response) => {
    const { message } = req.body;
    console.log("Body : ", req.body)

    if (!message || typeof message !== "string") {
        res.status(400).json({ error: "Message is required" });
        return;
    }

    console.warn("History:  ", history)
    try {
        const response = await llm_response(message, history);
        console.log("LLM Response : ", response)

        if (response) {
            res.json({ response, success: true });
        } else {
            const errorMsg = "I couldn't fetch valid data for that request. Please try rephrasing.";
            res.json({ error: errorMsg, success: false });
        }
    } catch (error) {
        console.error("Error in chat endpoint:", error);
        res.status(500).json({
            error: "An error occurred while fetching the data.",
            success: false
        });
    }
});

app.delete("/api/chat", (req: Request, res: Response) => {
    history.length = 0;
    res.json({ success: true, message: "Conversation history cleared" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}`);
});