import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

export type Monomer = {
  id: string;
  name: string;
  mass: number;
  createdAt?: string;
  updatedAt?: string;
};

type MonomerRow = {
  id: string;
  name: string;
  mass: number;
  created_at: string;
  updated_at: string;
};

type MonomerInput = {
  name: string;
  mass: number;
};

type UpdateMonomerInput = MonomerInput & {
  id: string;
};

function toMonomer(row: MonomerRow): Monomer {
  return {
    id: row.id,
    name: row.name,
    mass: row.mass,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateMonomerInput(data: MonomerInput) {
  const name = data.name.trim();
  const mass = Number(data.mass);

  if (!name) throw new Error("Monomer name is required.");
  if (!Number.isFinite(mass) || mass <= 0) {
    throw new Error("Mass must be a positive number.");
  }

  return { name, mass };
}

async function readMonomers(): Promise<Monomer[]> {
  const result = await env.DB.prepare(
    `SELECT id, name, mass, created_at, updated_at
     FROM monomers
     ORDER BY name ASC`,
  ).all<MonomerRow>();

  return result.results.map(toMonomer);
}

export const getMonomers = createServerFn({ method: "GET" }).handler(readMonomers);

export const addMonomer = createServerFn({ method: "POST" })
  .inputValidator((data: MonomerInput) => data)
  .handler(async ({ data }) => {
    const monomer = validateMonomerInput(data);
    const id = crypto.randomUUID();

    await env.DB.prepare("INSERT INTO monomers (id, name, mass) VALUES (?, ?, ?)")
      .bind(id, monomer.name, monomer.mass)
      .run();

    return readMonomers();
  });

export const updateMonomer = createServerFn({ method: "POST" })
  .inputValidator((data: UpdateMonomerInput) => data)
  .handler(async ({ data }) => {
    const monomer = validateMonomerInput(data);
    if (!data.id) throw new Error("Monomer id is required.");

    await env.DB.prepare(
      "UPDATE monomers SET name = ?, mass = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
      .bind(monomer.name, monomer.mass, data.id)
      .run();

    return readMonomers();
  });

export const deleteMonomer = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    if (!data.id) throw new Error("Monomer id is required.");

    await env.DB.prepare("DELETE FROM monomers WHERE id = ?").bind(data.id).run();

    return readMonomers();
  });
