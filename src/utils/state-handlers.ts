import { readState, writeState, type JDIState } from "./state";

/**
 * Transition state to "plan ready" after a plan has been created.
 */
export async function transitionToPlanReady(
  cwd: string,
  planPath: string,
  planName: string,
): Promise<void> {
  const state = await readState(cwd) ?? {};
  state.position = {
    ...state.position,
    plan: planPath,
    plan_name: planName,
    status: "planning",
  } as any;
  state.current_plan = {
    ...state.current_plan,
    path: planPath,
  } as any;
  state.review = {
    ...state.review,
    status: "in_review",
    scope: "plan",
  } as any;
  await updateSessionActivity(cwd, state);
}

/**
 * Transition state to "approved" after plan approval.
 */
export async function transitionToApproved(cwd: string): Promise<void> {
  const state = await readState(cwd) ?? {};
  state.review = {
    ...state.review,
    status: "approved",
    approved_at: new Date().toISOString(),
  } as any;
  await updateSessionActivity(cwd, state);
}

/**
 * Transition state to "executing" before implementation starts.
 */
export async function transitionToExecuting(
  cwd: string,
  taskId?: string,
  taskName?: string,
): Promise<void> {
  const state = await readState(cwd) ?? {};
  state.position = {
    ...state.position,
    status: "executing",
    task: taskId ?? state.position?.task ?? null,
    task_name: taskName ?? state.position?.task_name ?? null,
  } as any;
  await updateSessionActivity(cwd, state);
}

/**
 * Transition state to "complete" after implementation finishes.
 */
export async function transitionToComplete(cwd: string): Promise<void> {
  const state = await readState(cwd) ?? {};
  state.position = {
    ...state.position,
    status: "complete",
  } as any;
  await updateSessionActivity(cwd, state);
}

/**
 * Advance to the next task in the current plan.
 */
export async function advanceTask(cwd: string, completedTaskId: string): Promise<void> {
  const state = await readState(cwd) ?? {};
  if (state.current_plan) {
    const completed = state.current_plan.completed_tasks ?? [];
    if (!completed.includes(completedTaskId)) {
      completed.push(completedTaskId);
    }
    state.current_plan.completed_tasks = completed;

    const tasks = state.current_plan.tasks ?? [];
    const nextIndex = completed.length;
    state.current_plan.current_task_index = nextIndex < tasks.length ? nextIndex : null;
  }
  if (state.progress) {
    state.progress.tasks_completed = (state.progress.tasks_completed ?? 0) + 1;
  }
  await updateSessionActivity(cwd, state);
}

/**
 * Update session.last_activity and write state.
 */
async function updateSessionActivity(cwd: string, state: JDIState): Promise<void> {
  state.session = {
    ...state.session,
    last_activity: new Date().toISOString(),
  } as any;
  await writeState(cwd, state);
}
