export interface AiService {
  /**
   * Ask the LLM a question and get a response
   * @param question The question to ask
   * @returns The LLM's response
   */
  askLLM(question: string): Promise<string>;
}