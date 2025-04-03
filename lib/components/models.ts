export interface Todo {
  id: number;
  content: string;
}

export interface Account {
  id: string;
  owner: string;
  balance: number;
  currency: string;
  createAt: Date;
}

export interface Meta {
  totalCount: number;
}
