import client from "./client";

export interface Category {
  id: number;
  user_id: number;
  name: string;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await client.get("/categories");
  return data.categories;
}

export async function createCategory(name: string): Promise<Category> {
  const { data } = await client.post("/categories", { name });
  return data.category;
}

export async function updateCategory(id: number, name: string): Promise<Category> {
  const { data } = await client.put(`/categories/${id}`, { name });
  return data.category;
}

export async function deleteCategory(id: number): Promise<void> {
  await client.delete(`/categories/${id}`);
}
