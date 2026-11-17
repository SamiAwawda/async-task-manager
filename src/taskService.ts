import { randomUUID } from "node:crypto";
import { TaskNotFoundError, UserNotFoundError, ValidationError } from "./errors.js";
import type {
  NewTaskInput,
  NewUserInput,
  Task,
  TaskFilter,
  TaskUpdate,
  User,
} from "./types.js";

export interface TaskServiceOptions {
  /** Simulated latency for every operation, to mimic a real database call. */
  delayMs?: number;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function requireText(value: string, field: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new ValidationError(`${field} must not be empty`);
  }
  return trimmed;
}

export class TaskService {
  private readonly users = new Map<string, User>();
  private readonly tasks = new Map<string, Task>();
  private readonly delayMs: number;

  constructor(options: TaskServiceOptions = {}) {
    this.delayMs = options.delayMs ?? 0;
  }

  async createUser(input: NewUserInput): Promise<User> {
    await this.simulateLatency();
    const name = requireText(input.name, "name");
    const email = requireText(input.email, "email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError(`invalid email: ${email}`);
    }
    const user: User = { id: randomUUID(), name, email };
    this.users.set(user.id, user);
    return { ...user };
  }

  async createTask(input: NewTaskInput): Promise<Task> {
    await this.simulateLatency();
    const title = requireText(input.title, "title");
    if (input.assigneeId !== undefined) {
      this.requireUser(input.assigneeId);
    }
    const now = new Date();
    const task: Task = {
      id: randomUUID(),
      title,
      description: input.description ?? "",
      status: "todo",
      assigneeId: input.assigneeId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return this.copy(task);
  }

  async getTask(id: string): Promise<Task> {
    await this.simulateLatency();
    return this.copy(this.requireTask(id));
  }

  async listTasks(filter: TaskFilter = {}): Promise<Task[]> {
    await this.simulateLatency();
    return [...this.tasks.values()]
      .filter((t) => filter.status === undefined || t.status === filter.status)
      .filter((t) => filter.assigneeId === undefined || t.assigneeId === filter.assigneeId)
      .map((t) => this.copy(t));
  }

  async updateTask(id: string, update: TaskUpdate): Promise<Task> {
    await this.simulateLatency();
    const task = this.requireTask(id);
    if (update.title !== undefined) {
      task.title = requireText(update.title, "title");
    }
    if (update.description !== undefined) {
      task.description = update.description;
    }
    if (update.status !== undefined) {
      task.status = update.status;
    }
    task.updatedAt = new Date();
    return this.copy(task);
  }

  async assignTask(taskId: string, userId: string): Promise<Task> {
    await this.simulateLatency();
    const task = this.requireTask(taskId);
    this.requireUser(userId);
    task.assigneeId = userId;
    task.updatedAt = new Date();
    return this.copy(task);
  }

  async deleteTask(id: string): Promise<void> {
    await this.simulateLatency();
    this.requireTask(id);
    this.tasks.delete(id);
  }

  private async simulateLatency(): Promise<void> {
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }
  }

  private requireTask(id: string): Task {
    const task = this.tasks.get(id);
    if (task === undefined) {
      throw new TaskNotFoundError(id);
    }
    return task;
  }

  private requireUser(id: string): User {
    const user = this.users.get(id);
    if (user === undefined) {
      throw new UserNotFoundError(id);
    }
    return user;
  }

  private copy(task: Task): Task {
    return { ...task, createdAt: new Date(task.createdAt), updatedAt: new Date(task.updatedAt) };
  }
}
