import alchemy from "alchemy";
import { D1Database, TanStackStart } from "alchemy/cloudflare";

const app = await alchemy("macromasser");

const database = await D1Database("database", {
  name: "macromasser-db",
  migrationsDir: "./migrations",
});

export const website = await TanStackStart("website", {
  name: "macromasser",
  bindings: {
    DB: database,
  },
  domains: [
    {
      domainName: "mass.axbolduc.com",
      zoneId: "aebe2a60ac5413441a3aaf9b42d97761",
    },
  ],
  adopt: true,
});

console.log({
  url: website.url,
});

await app.finalize();
