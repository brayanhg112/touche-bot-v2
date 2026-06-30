// test-models.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function listModels() {
    const models = await genAI.listModels();
    console.log("Modelos disponibles:");
    models.models.forEach(m => console.log(m.name));
}

listModels().catch(console.error);