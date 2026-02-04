import { apiClient } from './client';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
    products?: any[];
}

export const aiChatApi = {
    async sendMessage(message: string, context?: Record<string, any>): Promise<{ reply: string; action: string; products?: any[] }> {
        const response = await apiClient.post('/ai/chat/assist', { message, context });
        return response.data?.data || response.data;
    },
};
