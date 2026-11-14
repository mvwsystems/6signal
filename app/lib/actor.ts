import { AsyncLocalStorage } from "async_hooks";
import type { Role } from "./dashboard-auth";

// Who is making the current request, carried through the async call chain so
// every activity-log write records the real account (Matt or Casey) without
// threading an actor argument through every data function.

export interface Actor { role: Role; name: string }

const store = new AsyncLocalStorage<Actor>();

export function runAs<T>(actor: Actor, fn: () => Promise<T>): Promise<T> {
  return store.run(actor, fn);
}

export function currentActor(): Actor | null {
  return store.getStore() ?? null;
}
