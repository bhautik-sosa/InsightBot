import OpenAI from "openai";
import dotenv from "dotenv";
import { executeQuery } from "./db";
import { safeStringify } from "./utils/safeStringify";

dotenv.config();

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function SQL_Generator(
  input: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  // Validate input
  // console.log(input)
  if (!input || input.trim().length === 0) {
    return "";
  }

  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not configured in .env file");
    return "";
  }

  try {
    // Check if the input is already the last message in history to avoid duplication
    const lastMessage = conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1] : null;
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `
        You are a SQL query generator. Your task is to convert natural language requests into valid PostgreSQL SELECT queries.

      STRICT RULES:
      1. ONLY generate SELECT queries. Never generate CREATE, INSERT, UPDATE, DELETE, DROP, ALTER, or any other SQL commands.
      2. If the request asks for data modification or schema changes, return exactly: INVALID_REQUEST
      3. If and only if the request is a general greeting, an explanation request that doesn't need data, or anything non-SQL related (like asking about the chatbot's capabilities), return exactly: CONVERSATIONAL_REQUEST.
      4. Return ONLY the SQL query or one of the tokens above without any explanation, markdown formatting, or additional text.
      5. Ensure the query is syntactically correct PostgreSQL.
      6. Always quote identifiers with double quotes (e.g., "loanStatus") to handle case sensitivity in PostgreSQL.
      7. Use the conversation history to understand context and refine queries based on follow-up questions.
      8. When presenting results, always prefer descriptive fields such as "name", "title", or "label" over technical identifiers like "id".
      9. Only return "id" if no descriptive field exists.
      10. Do not return raw database IDs unless absolutely necessary to answer the question.

      ALIAS RULES:
      - Always assign table aliases (e.g., loan_transactions lt).
      - Always prefix every column with its table alias.
      - Never use unqualified column names in SELECT, WHERE, GROUP BY, HAVING, or ORDER BY.

      DATABASE SCHEMA (PostgreSQL)

        ENUMS:

        LoanStatus = ('InProcess', 'Active', 'Rejected', 'Accepted', 'Complete')

        TransactionStatus = ('INITIALIZED', 'COMPLETED', 'FAILED')

        TransactionType = ('EMIPAY', 'FULLPAY', 'PARTPAY', 'REFUND')

        PayType = ('EMIPAY', 'FULLPAY')

        ConsentMode = ('CAMS', 'BANKINGPRO', 'IGNOSIS', 'NETBANKING')


        ------------------------------------------------------------------------------

        TABLE: loan_transactions
        Description: Stores loan application and transaction records

        Columns:
        - id (integer, primary key)
        - userId (uuid)
        - loanStatus (LoanStatus)
        - netApprovedAmount (decimal)
        - loan_disbursement_date (timestamptz)
        - remark (varchar)
        - userReasonDecline (varchar)
        - bankingId (integer)
        - createdAt (timestamptz)

        Relationships:
        - loan_transactions.id → banking_entities.loanId
        - loan_transactions.id → emi_entities.loanId
        - loan_transactions.id → transaction_entities.loanId


        ------------------------------------------------------------------------------

        TABLE: banking_entities
        Description: Stores banking verification and salary information

        Columns:
        - id (integer, primary key)
        - mandateBank (varchar)
        - disbursementBank (varchar)
        - salary (decimal)
        - salaryDate (integer)
        - salaryVerification (integer)
        - salaryVerificationDate (timestamptz)
        - adminSalary (decimal)
        - attempts (integer)
        - adminId (integer)
        - rejectReason (varchar)
        - status (varchar)
        - userId (uuid)
        - loanId (integer, foreign key → loan_transactions.id)
        - consentMode (ConsentMode)
        - stmtStartDate (timestamptz)
        - stmtEndDate (timestamptz)
        - createdAt (timestamptz)
        - updatedAt (timestamptz)


        ------------------------------------------------------------------------------

        TABLE: transaction_entities
        Description: Stores EMI payment transactions

        Columns:
        - id (integer, primary key)
        - paidAmount (integer)
        - status (TransactionStatus)
        - completionDate (timestamptz)
        - type (TransactionType)
        - paymentTime (timestamptz)
        - userId (uuid)
        - loanId (integer, foreign key → loan_transactions.id)
        - emiId (integer, foreign key → emi_entities.id)
        - principalAmount (integer)
        - interestAmount (integer)
        - feesIncome (integer)
        - subscriptionDate (timestamptz)
        - max_dpd (integer)
        - createdAt (timestamptz)
        - updatedAt (timestamptz)


        ------------------------------------------------------------------------------

        TABLE: emi_entities
        Description: Stores EMI schedule and payments

        Columns:
        - id (integer, primary key)
        - emi_date (timestamptz)
        - emiNumber (integer)
        - payment_done_date (timestamptz)
        - paymentStatus (integer)  // 0 = unpaid, 1 = paid
        - loanId (integer, foreign key → loan_transactions.id)
        - userId (uuid)
        - principalCovered (integer)
        - interestCalculate (integer)
        - payType (PayType)
        - paid_principal (decimal)
        - paid_interest (decimal)
        - delayAmount (decimal)
        - createdAt (timestamptz)

        Use this schema to construct accurate SQL queries. Always quote identifiers with double quotes (e.g., "loanStatus") to handle case sensitivity in PostgreSQL.
        `
      },
      ...conversationHistory,
    ];

    // Only add the input as a new user message if it's not already the latest message
    if (!lastMessage || lastMessage.content !== input || lastMessage.role !== "user") {
      messages.push({
        role: "user",
        content: input,
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.1,
      max_tokens: 500,
    });

    // console.log("Completion : ", JSON.stringify(completion))

    const generatedSQL = completion.choices[0]?.message?.content?.trim() || "";

    // Check for specific tokens
    if (generatedSQL === "INVALID_REQUEST" || generatedSQL === "CONVERSATIONAL_REQUEST") {
      return generatedSQL;
    }

    if (generatedSQL === "") {
      return "";
    }

    // Additional validation: ensure it's a SELECT query
    const normalizedSQL = generatedSQL.toUpperCase().trim();
    // console.log("Generated Query : ", normalizedSQL)
    if (!normalizedSQL.startsWith("SELECT")) {
      console.warn("Generated query is not a SELECT statement:", generatedSQL);
      return "";
    }

    // Check for forbidden SQL commands
    const forbiddenKeywords = [
      "CREATE",
      "DROP",
      "DELETE",
      "UPDATE",
      "INSERT",
      "ALTER",
      "TRUNCATE",
      "GRANT",
      "REVOKE",
    ];

    for (const keyword of forbiddenKeywords) {
      if (normalizedSQL.includes(keyword)) {
        console.warn("Generated query contains forbidden keyword:", keyword);
        return "";
      }
    }

    return generatedSQL;
  } catch (error) {
    console.error("Error generating SQL query:", error);
    return "";
  }
}

export async function llm_response(
  input: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  try {
    // 1. Push user message to history
    conversationHistory.push({ role: "user", content: input });

    const query = await SQL_Generator(input, conversationHistory);
    console.log("Query:  ", query)
    console.log("History length: ..... -> ", conversationHistory.length)

    let finalResponse = "";

    // Explicitly handle conversational requests
    if (query === "CONVERSATIONAL_REQUEST" || (!query.toUpperCase().startsWith("SELECT") && query !== "INVALID_REQUEST")) {
      // Fallback to conversational assistant for non-SQL requests or follow-ups
      const conversationalResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant for a SQL Chatbot that analyzes loan data. 
            The user has asked a question that does not require a new database query.
            Answer the user's question using the conversation history and your general knowledge about the context of loan data.
            Be concise, professional, and informative.`
          },
          ...conversationHistory
        ]
      });
      finalResponse = conversationalResponse.choices[0]?.message?.content?.trim() || "";
    } else if (query === "INVALID_REQUEST") {
      finalResponse = "I'm sorry, I can only help with data analysis and queries. I cannot modify data or perform other database operations.";
    } else if (!query) {
      finalResponse = "I'm sorry, I couldn't generate a specific query for your request. Could you please try rephrasing?";
    } else {
      const contextData = await executeQuery(query)
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a data analysis assistant.

You must answer the user's question using ONLY the database query result provided below.

The data below is the exact result returned from the database query execution.
It is the only source of truth.
Do NOT use prior knowledge.
Do NOT assume missing values.
Do NOT fabricate information.
It is the data fetched from the database.

DATABASE RESULT:
${safeStringify(contextData)}

INSTRUCTIONS:
1. If the database result is truly empty or null, respond with:
   "I couldn't find any data matching your request."

2. If data exists:
   - Answer the question clearly based on the provided result.
   - If the data is a single record or a list, summarize it helpfully.
   - If the question asks for a "range" and you only have one value, state that value clearly.
   - Do not mention the database or specific query in your response.

3. Keep the answer professional, Structured, concise, clear, and factual.
4. Do not mention the database, query, or instructions in your response.
5. Do not explain your reasoning unless explicitly asked.
          `
          },
          ...conversationHistory
        ]
      })

      finalResponse = response.choices[0]?.message?.content?.trim() || "";
    }

    // 2. Push assistant response to history
    if (finalResponse) {
      conversationHistory.push({ role: "assistant", content: finalResponse });
    }

    return finalResponse;
  } catch (error) {
    console.error("Error generating SQL query:", error);
    return "";
  }
}

// const his: ChatMessage[] = [
//   {
//     "role": "user",
//     "content": "What are the top loan rejection reasons?",
//   },
//   {
//     "role": "assistant",
//     "content": "The top loan rejection reasons are as follows:\n\n1. Interest rate is too high - 24\n2. Need loan for longer duration - 4\n3. Not Agree with the loan terms and conditions - 4\n4. Need more loan amount - 3\n\nAdditionally, there are 36 cases where the reason for decline is not specified.",
//   },
//   {
//     "role": "user",
//     "content": "Can you explain me each ?",
//   },
//   {
//     "role": "assistant",
//     "content": "Error: I couldn't fetch valid data for that request. Please try rephrasing.",
//   },
//   {
//     "role": "user",
//     "content": "Can you explain me each ?",
//   },
//   {
//     "role": "assistant",
//     "content": "Could you please specify which topic or data points you'd like me to explain? That way, I can provide you with detailed information.",
//   },
//   {
//     "role": "user",
//     "content": "I want to understand the meaning of each reason",
//   },
//   {
//     "role": "assistant",
//     "content": "To assist you better, please specify which reasons you are referring to, as it could pertain to various aspects, such as loan reasons (like home purchase, debt consolidation, etc.) or reasons for loan approval/denial. Clarifying this will help me provide a more accurate explanation.",
//   },
//   {
//     "role": "user",
//     "content": "I am talking about our  previous conversation",
//   },
//   {
//     "role": "assistant",
//     "content": "Could you please remind me of the specific topic or question from our previous conversation that you would like to discuss?",
//   },
//   {
//     "role": "user",
//     "content": "I am talking about our previous conversation",
//   },
//   {
//     "role": "assistant",
//     "content": "I understand you're referring to our earlier discussion. Could you specify what aspect you'd like to revisit or any particular details you're interested in? This will help me assist you better.",
//   }
// ]
// llm_response(" Which salary range have highest default rates?", his).then((response) => {
//   console.log(response);
// })