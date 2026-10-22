import { app } from "./app";
import { env } from "./env";

export { app };

app.listen({ port: env.PORT, hostname: env.HOST });
console.log(`RideGo API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
console.log(`OpenAPI docs: http://localhost:${env.PORT}/api/v1/docs`);

// Finish in-flight requests before exiting, so a deploy does not cut a booking transaction in half.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    console.log(`${signal} received, shutting down`);
    await app.stop();
    process.exit(0);
  });
}
