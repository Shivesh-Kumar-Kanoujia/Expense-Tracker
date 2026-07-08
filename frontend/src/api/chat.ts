import client from "./client";

export async function sendMessage(message: string): Promise<string> {
  const { data } = await client.post("/chat", { message });
  return data.reply;
}
