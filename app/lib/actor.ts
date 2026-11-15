import { AsyncLocalStorage } from "async_hooks";
import type { Role } from "./dashboard-auth";

// Who is making the current request, carried through the async call chain so
// every Activity write records the real account (Matt, Casey, Casey's
// automation) without threading an actor argument through every function.

export interface Actor { role: Role; name: string }

const store = new AsyncLocalStorage<Actor>();

export function runAs<T>(actor: Actor, fn: () => Promise<T>): Promise<T> {
  return store.run(actor, fn);
}

export function currentActor(): Actor | null {
  return store.getStore() ?? null;
}
