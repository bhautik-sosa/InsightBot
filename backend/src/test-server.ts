import express from "express";

const app = express();
app.use(express.json());

// Test 1: Direct stdout
process.stdout.write("=== TEST 1: Direct stdout (should appear) ===\n");

// Test 2: Console.log at startup
console.log("=== TEST 2: Console.log at startup (should appear) ===");

// Test 3: Immediate function
(() => {
    process.stdout.write("=== TEST 3: IIFE stdout (should appear) ===\n");
    console.log("=== TEST 3: IIFE console (should appear) ===");
})();

// Test 4: Simple GET endpoint
app.get("/test", (req, res) => {
    // Multiple output methods
    process.stdout.write(">>> TEST 4A: stdout in handler\n");
    process.stderr.write(">>> TEST 4B: stderr in handler\n");
    console.log(">>> TEST 4C: console.log in handler");
    console.error(">>> TEST 4D: console.error in handler");

    res.json({ message: "Check terminal for logs" });
});

// Test 5: POST endpoint
// app.post("/test", (req, res) => {
//     process.stdout.write(">>> TEST 5A: POST stdout\n");
//     process.stdout.write(">>> TEST 5B: Body: " + JSON.stringify(req.body) + "\n");
//     console.log(">>> TEST 5C: POST console.log");

//     res.json({ success: true });
// });

const PORT = 3000;

app.listen(PORT, () => {
    process.stdout.write("\n" + "=".repeat(60) + "\n");
    process.stdout.write("TEST SERVER STARTED ON PORT " + PORT + "\n");
    process.stdout.write("=".repeat(60) + "\n");
    process.stdout.write("\nRun these tests:\n");
    process.stdout.write("1. curl http://localhost:3000/test\n");
    process.stdout.write("2. curl -X POST http://localhost:3000/test -H 'Content-Type: application/json' -d '{\"test\":\"data\"}'\n");
    process.stdout.write("\nWatch the terminal for output!\n\n");
});