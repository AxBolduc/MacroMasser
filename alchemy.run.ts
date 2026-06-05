import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";

const app = await alchemy("macromasser");

export const website = await TanStackStart("website", {
  name: "macromasser",
  domains: [
    {
      domainName: "mass.axbolduc.com",
      zoneId: "aebe2a60ac5413441a3aaf9b42d97761",
    },
  ],
});

console.log({
  url: website.url,
});

await app.finalize();
