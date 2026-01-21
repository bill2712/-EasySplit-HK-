import { GoogleGenAI } from "@google/genai";
import { User, Expense, Transaction } from '../types';

const getGeminiClient = () => {
    // Check if API key exists. If not, we can't initialize.
    // The main component handles the UI logic for missing keys.
    if (!process.env.API_KEY) {
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateSummaryMessage = async (
    users: User[],
    expenses: Expense[],
    transactions: Transaction[]
): Promise<string> => {
    const ai = getGeminiClient();
    if (!ai) {
        return "錯誤: 請先設定 API Key (Error: API Key missing)";
    }

    // Format data for the prompt
    const userMap = new Map(users.map(u => [u.id, u.name]));
    
    const expenseSummary = expenses.map(e => 
        `- ${e.title}: $${e.amount} (Paid by: ${userMap.get(e.payerId)})`
    ).join('\n');

    const transactionSummary = transactions.map(t => 
        `- ${userMap.get(t.fromId)} needs to pay ${userMap.get(t.toId)}: $${t.amount}`
    ).join('\n');

    const prompt = `
    You are a helpful assistant for a group of friends in Hong Kong who just had a meal/gathering.
    Write a friendly, colloquial message in Traditional Chinese (Hong Kong style, Cantonese written is fine but keep it readable).
    
    Context:
    - We used an app called "夾錢易".
    - Here is the list of expenses:
    ${expenseSummary}
    
    - Here is the calculated settlement (Who pays whom):
    ${transactionSummary}

    Instructions:
    1. Start with a fun greeting.
    2. Briefly summarize the total spending if possible.
    3. Clearly list the final "Give & Take" (transaction) instructions. Use "👉" for clarity.
    4. Mention if there were any birthday treats (User with isBirthday=true) implicitly if obvious, or just keep it positive.
    5. End with a polite "remember to PayMe/FPS" reminder.
    6. Keep it concise enough for a WhatsApp message.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "無法生成訊息，請稍後再試。";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "生成訊息時發生錯誤，請檢查網絡或 API Key。";
    }
};
