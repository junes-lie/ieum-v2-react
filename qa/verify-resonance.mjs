// Legacy entry point retained for compatibility. The former checks encoded invalid
// product assumptions, so this delegates to the user-visible journey regression.
await import('./verify-user-journey.mjs')
