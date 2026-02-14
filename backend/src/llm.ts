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

  if (!input || input.trim().length === 0) {
    return "";
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not configured in .env file");
    return "";
  }

  try {

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
      11. Make sure that generated SQL query is not vulnerable to divide by zero exception.

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

    if (generatedSQL === "INVALID_REQUEST" || generatedSQL === "CONVERSATIONAL_REQUEST") {
      return generatedSQL;
    }

    if (generatedSQL === "") {
      return "";
    }

    const normalizedSQL = generatedSQL.toUpperCase().trim();
    // console.log("Generated Query : ", normalizedSQL)
    if (!normalizedSQL.startsWith("SELECT")) {
      console.warn("Generated query is not a SELECT statement:", generatedSQL);
      return "";
    }

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

    conversationHistory.push({ role: "user", content: input });

    const query = await SQL_Generator(input, conversationHistory);
    console.log("Query:  ", query)
    console.log("History length: ..... -> ", conversationHistory.length)

    let finalResponse = "";


    if (query === "CONVERSATIONAL_REQUEST" || (!query.toUpperCase().startsWith("SELECT") && query !== "INVALID_REQUEST")) {
      const conversationalResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a sophisticated Data Analytics Insights Assistant for a Loan Management System.

The user has asked a question that does not require a new database query.
Your goal is to provide helpful, data-driven insights using the existing conversation history and your general knowledge about the loan domain.

CAPABILITIES:
1. **Explain Trends**: Help the user understand trends or patterns mentioned in previous results.
2. **Clarify Terms**: Explain technical or domain-specific terms (e.g., DPD, EMI, Loan Status, Mandate, Consent Mode).
3. **Compare Data**: If the user asks for comparisons of previously fetched data, provide a structured summary.
4. **Suggest Questions**: Proactively suggest relevant follow-up questions that could lead to deeper data insights.

TONE:
- Professional, analytical, and supportive.
- Avoid generic filler text; prioritize factual and helpful information.
- Use markdown for structure (bullet points, bold text) to make insights easy to digest.`
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
      console.log("ContextData", contextData)
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional Data Analytics Insights Assistant.

ROLE:
Your primary task is to interpret the database query result provided below and provide clear, actionable insights to the user.

SOURCE OF TRUTH:
- Only use the provided DATABASE RESULT below.
- Do NOT use prior knowledge outside the provided context.
- Do NOT fabricate data or assume missing values.

DATABASE RESULT:
${safeStringify(contextData)}

INSTRUCTIONS:
1. **Format**: Use a structured output (bullet points, bold text) for readability.
2. **Empty Results**: If the result is empty or null, say: "I couldn't find any data matching your request."
3. **Insight Generation**:
   - Don't just list numbers; explain what they mean (e.g., "The average salary is ₹1.2L, which suggests...").
   - Highlight outliers or significant trends if present.
   - If the request asks for a comparison and the data allows, perform the comparison clearly.
4. **Constraints**:
   - Do NOT mention "database", "query", "SQL", or "PostgreSQL".
   - Keep the response professional, concise, and focused on the user's question.
   - Do not explain your reasoning or mention these instructions.
`
          },
          ...conversationHistory
        ]
      })

      finalResponse = response.choices[0]?.message?.content?.trim() || "";
    }

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