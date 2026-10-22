import { app } from "./app";
import { closeDb } from "./libs/db";
import { startHoldSweeper } from "./routes/booking/holds";
import { env } from "./env";

export { app };

app.listen({ port: env.PORT, hostname: env.HOST });
const stopHoldSweeper = startHoldSweeper();
console.log(`RideGo API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
console.log(`OpenAPI docs: http://localhost:${env.PORT}/api/v1/docs`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    console.log(`${signal} received, shutting down`);
    stopHoldSweeper();
    await app.stop();
    await closeDb();
    process.exit(0);
  });
}
