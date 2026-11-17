import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TaskService } from "./taskService.js";
import { TaskNotFoundError, UserNotFoundError, ValidationError } from "./errors.js";

const makeService = () => new TaskService({ delayMs: 0 });

describe("users", () => {
  it("creates a user with a generated id", async () => {
    const service = makeService();
    const user = await service.createUser({ name: "Sami", email: "sami@example.com" });
    assert.equal(user.name, "Sami");
    assert.equal(user.email, "sami@example.com");
    assert.ok(user.id.length > 0);
  });

  it("rejects a user with an invalid email", async () => {
    const service = makeService();
    await assert.rejects(service.createUser({ name: "Sami", email: "not-an-email" }), ValidationError);
  });

  it("rejects a user with an empty name", async () => {
    const service = makeService();
    await assert.rejects(service.createUser({ name: "   ", email: "a@b.com" }), ValidationError);
  });
});

describe("createTask", () => {
  it("creates a task with status todo and timestamps", async () => {
    const service = makeService();
    const task = await service.createTask({ title: "Write README" });
    assert.equal(task.title, "Write README");
    assert.equal(task.status, "todo");
    assert.equal(task.description, "");
    assert.equal(task.assigneeId, null);
    assert.ok(task.createdAt instanceof Date);
    assert.equal(task.createdAt.getTime(), task.updatedAt.getTime());
  });

  it("rejects an empty title", async () => {
    const service = makeService();
    await assert.rejects(service.createTask({ title: "  " }), ValidationError);
  });

  it("rejects an assignee that does not exist", async () => {
    const service = makeService();
    await assert.rejects(service.createTask({ title: "X", assigneeId: "nope" }), UserNotFoundError);
  });

  it("accepts an existing assignee", async () => {
    const service = makeService();
    const user = await service.createUser({ name: "Sami", email: "sami@example.com" });
    const task = await service.createTask({ title: "X", assigneeId: user.id });
    assert.equal(task.assigneeId, user.id);
  });
});

describe("getTask", () => {
  it("returns an existing task", async () => {
    const service = makeService();
    const created = await service.createTask({ title: "X" });
    const found = await service.getTask(created.id);
    assert.deepEqual(found, created);
  });

  it("rejects with TaskNotFoundError for an unknown id", async () => {
    const service = makeService();
    await assert.rejects(service.getTask("missing"), TaskNotFoundError);
  });

  it("does not let callers change stored data through the returned object", async () => {
    const service = makeService();
    const created = await service.createTask({ title: "Original" });
    created.title = "Hacked";
    const found = await service.getTask(created.id);
    assert.equal(found.title, "Original");
  });
});

describe("listTasks", () => {
  it("returns all tasks when no filter is given", async () => {
    const service = makeService();
    await service.createTask({ title: "A" });
    await service.createTask({ title: "B" });
    const tasks = await service.listTasks();
    assert.equal(tasks.length, 2);
  });

  it("filters by status", async () => {
    const service = makeService();
    const a = await service.createTask({ title: "A" });
    await service.createTask({ title: "B" });
    await service.updateTask(a.id, { status: "done" });
    const done = await service.listTasks({ status: "done" });
    assert.deepEqual(done.map((t) => t.title), ["A"]);
  });

  it("filters by assignee", async () => {
    const service = makeService();
    const user = await service.createUser({ name: "Sami", email: "sami@example.com" });
    await service.createTask({ title: "Mine", assigneeId: user.id });
    await service.createTask({ title: "Nobody's" });
    const mine = await service.listTasks({ assigneeId: user.id });
    assert.deepEqual(mine.map((t) => t.title), ["Mine"]);
  });
});

describe("updateTask", () => {
  it("updates fields and bumps updatedAt", async () => {
    const service = makeService();
    const created = await service.createTask({ title: "Old" });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const updated = await service.updateTask(created.id, { title: "New", status: "in-progress" });
    assert.equal(updated.title, "New");
    assert.equal(updated.status, "in-progress");
    assert.ok(updated.updatedAt.getTime() > created.updatedAt.getTime());
    assert.equal(updated.createdAt.getTime(), created.createdAt.getTime());
  });

  it("rejects an unknown id", async () => {
    const service = makeService();
    await assert.rejects(service.updateTask("missing", { title: "X" }), TaskNotFoundError);
  });

  it("rejects an empty title", async () => {
    const service = makeService();
    const created = await service.createTask({ title: "Old" });
    await assert.rejects(service.updateTask(created.id, { title: "" }), ValidationError);
  });
});

describe("assignTask", () => {
  it("assigns an existing user to an existing task", async () => {
    const service = makeService();
    const user = await service.createUser({ name: "Sami", email: "sami@example.com" });
    const task = await service.createTask({ title: "X" });
    const assigned = await service.assignTask(task.id, user.id);
    assert.equal(assigned.assigneeId, user.id);
  });

  it("rejects an unknown user", async () => {
    const service = makeService();
    const task = await service.createTask({ title: "X" });
    await assert.rejects(service.assignTask(task.id, "nope"), UserNotFoundError);
  });

  it("rejects an unknown task", async () => {
    const service = makeService();
    const user = await service.createUser({ name: "Sami", email: "sami@example.com" });
    await assert.rejects(service.assignTask("missing", user.id), TaskNotFoundError);
  });
});

describe("deleteTask", () => {
  it("removes the task", async () => {
    const service = makeService();
    const task = await service.createTask({ title: "X" });
    await service.deleteTask(task.id);
    await assert.rejects(service.getTask(task.id), TaskNotFoundError);
  });

  it("rejects an unknown id", async () => {
    const service = makeService();
    await assert.rejects(service.deleteTask("missing"), TaskNotFoundError);
  });
});

describe("async behavior", () => {
  it("waits for the simulated delay before resolving", async () => {
    const service = new TaskService({ delayMs: 40 });
    const start = Date.now();
    await service.createTask({ title: "Slow" });
    assert.ok(Date.now() - start >= 35);
  });
});
