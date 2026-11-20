/* eslint-disable */
// Env contract for the CREW test-only Email Worker.
// Regenerate with `npm run cf-typegen` after changing wrangler.jsonc.
interface __BaseEnv_Env {
  ROUTE_ADDRESS: "alerts@crew-ops.dev";
}
declare namespace Cloudflare {
  interface GlobalProps {
    mainModule: typeof import("./src/index");
  }
  interface Env extends __BaseEnv_Env {}
}
interface Env extends __BaseEnv_Env {}
