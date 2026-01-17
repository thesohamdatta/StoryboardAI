import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
    if (!genAI) {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY is not set');
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }
    return genAI;
}

export function getGeminiModel(modelName: string = 'gemini-1.5-flash') {
    return getClient().getGenerativeModel({ model: modelName });
}

export function getGeminiVisionModel() {
    return getClient().getGenerativeModel({ model: 'gemini-pro-vision' });
}
