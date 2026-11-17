import { TaskService } from "./taskService.js";
import { TaskNotFoundError, ValidationError } from "./errors.js";

async function main(): Promise<void> {
  const service = new TaskService({ delayMs: 100 });

  console.log("--- Success cases ---");
  const user = await service.createUser({ name: "Sami", email: "sami@example.com" });
  console.log("Created user:", user);

  // Independent operations can run in parallel with Promise.all.
  const [writeCode, writeDocs] = await Promise.all([
    service.createTask({ title: "Write code", assigneeId: user.id }),
    service.createTask({ title: "Write README", description: "Document AI use" }),
  ]);
  console.log("Created tasks:", writeCode.title, "and", writeDocs.title);

  const started = await service.updateTask(writeCode.id, { status: "in-progress" });
  console.log("Updated:", started.title, "->", started.status);

  const assigned = await service.assignTask(writeDocs.id, user.id);
  console.log("Assigned:", assigned.title, "->", user.name);

  const mine = await service.listTasks({ assigneeId: user.id });
  console.log("Tasks for", user.name + ":", mine.map((t) => t.title));

  await service.deleteTask(writeDocs.id);
  console.log("Deleted:", writeDocs.title);

  console.log("\n--- Failure cases ---");
  try {
    await service.getTask("does-not-exist");
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      console.log("Caught TaskNotFoundError:", error.message);
    } else {
      throw error;
    }
  }

  try {
    await service.createTask({ title: "   " });
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log("Caught ValidationError:", error.message);
    } else {
      throw error;
    }
  }

  // Promise.allSettled lets us see every outcome even when some operations fail.
  const results = await Promise.allSettled([
    service.getTask(writeCode.id),
    service.getTask(writeDocs.id), // already deleted
  ]);
  results.forEach((result, i) => {
    console.log(`Lookup #${i + 1}:`, result.status === "fulfilled" ? "ok" : `failed (${result.reason.message})`);
  });
}

main().catch((error: unknown) => {
  console.error("Unexpected error:", error);
  process.exitCode = 1;
});
