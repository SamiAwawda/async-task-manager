export type TaskStatus = "todo" | "in-progress" | "done";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewUserInput {
  name: string;
  email: string;
}

export interface NewTaskInput {
  title: string;
  description?: string;
  assigneeId?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface TaskFilter {
  status?: TaskStatus;
  assigneeId?: string;
}
