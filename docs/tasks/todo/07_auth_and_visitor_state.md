# Task 07: Auth UI & Visitor Identity Layer

## Architecture Context
Replacing the hard wall of authentication with a fluid Visitor -> User upgrade path using `@dopomogai/supabase-client`. This ensures a native-like OS experience where a user can interact with the infinite canvas instantly, claiming their data once they decide to log in.

## Implementation Steps
1. **Import the unified Auth package:** Integrate `@dopomogai/supabase-client` into the FE.
2. **Visitor state initialization:** On application boot, check for a valid persistent JWT. If none exists, initialize a temporary `visitor` UUID to tag all local spatial events.
3. **Auth UI Gate:** Provide a clear, non-intrusive UI entry point (e.g., in Settings or Top Bar) to invoke the auth package's Login/SSO screens.
4. **Ownership Transfer:** Upon successful authentication, swap the local Visitor UUID with the real User JWT in the state store, and trigger an ownership transfer API call to the Backend to claim the visitor's timeline sequence.
