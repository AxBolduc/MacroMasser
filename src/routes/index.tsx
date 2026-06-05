import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  addMonomer,
  deleteMonomer,
  getMonomers,
  type Monomer,
  updateMonomer,
} from "../server/monomers";

type Macrocycle = {
  formula: string;
  mass: number;
  counts: Record<string, number>;
};

export const Route = createFileRoute("/")({
  component: App,
  loader: async () => await getMonomers(),
});

function generateMacrocycles(selected: Monomer[], size: number): Macrocycle[] {
  if (selected.length === 0 || size < 1) return [];

  const results: Macrocycle[] = [];
  const counts = Array(selected.length).fill(0) as number[];

  function visit(index: number, remaining: number) {
    if (index === selected.length - 1) {
      counts[index] = remaining;
      const composition = selected
        .map((monomer, monomerIndex) => ({ monomer, count: counts[monomerIndex] }))
        .filter(({ count }) => count > 0);

      results.push({
        formula: composition
          .map(({ monomer, count }) => `${monomer.name}${count > 1 ? count : ""}`)
          .join("-"),
        mass: composition.reduce(
          (total, { monomer, count }) => total + monomer.mass * count,
          0,
        ),
        counts: Object.fromEntries(
          composition.map(({ monomer, count }) => [monomer.id, count]),
        ),
      });
      return;
    }

    for (let count = remaining; count >= 0; count -= 1) {
      counts[index] = count;
      visit(index + 1, remaining - count);
    }
  }

  visit(0, size);
  return results.sort((a, b) => a.mass - b.mass || a.formula.localeCompare(b.formula));
}

function App() {
  const router = useRouter();
  const monomers = Route.useLoaderData() as Monomer[];
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    monomers.map((monomer) => monomer.id),
  );
  const [size, setSize] = useState(3);
  const [name, setName] = useState("");
  const [mass, setMass] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedMonomers = useMemo(
    () => monomers.filter((monomer) => selectedIds.includes(monomer.id)),
    [monomers, selectedIds],
  );

  const macrocycles = useMemo(
    () => generateMacrocycles(selectedMonomers, size),
    [selectedMonomers, size],
  );

  async function refresh(nextMonomers: Monomer[]) {
    setSelectedIds((current) => current.filter((id) => nextMonomers.some((m) => m.id === id)));
    await router.invalidate();
  }

  async function submitMonomer() {
    setIsSaving(true);
    setError(null);
    try {
      const data = { name, mass: Number(mass) };
      const nextMonomers = editingId
        ? await updateMonomer({ data: { ...data, id: editingId } })
        : await addMonomer({ data });
      setName("");
      setMass("");
      setEditingId(null);
      await refresh(nextMonomers);
    } catch (event) {
      setError(event instanceof Error ? event.message : "Unable to save monomer.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeMonomer(monomer: Monomer) {
    if (!confirm(`Delete monomer “${monomer.name}”? Generated results will update.`)) return;

    setError(null);
    const nextMonomers = await deleteMonomer({ data: { id: monomer.id } });
    await refresh(nextMonomers);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-8 rounded-3xl bg-slate-950 px-8 py-10 text-white shadow-xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
          Macromasser
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Enumerate macrocycle compositions by mass
        </h1>
        <p className="max-w-3xl text-lg text-slate-300">
          Select monomers, choose a macrocycle size, and view every composition with repetition.
          Monomers are stored in Cloudflare D1 and can be managed below.
        </p>
      </section>

      <section className="mb-8 grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Monomers</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {monomers.map((monomer) => (
              <label key={monomer.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(monomer.id)}
                  onChange={(event) => {
                    setSelectedIds((current) =>
                      event.target.checked
                        ? [...current, monomer.id]
                        : current.filter((id) => id !== monomer.id),
                    );
                  }}
                />
                <span>
                  <span className="block font-medium">{monomer.name}</span>
                  <span className="text-sm text-slate-500">{monomer.mass.toFixed(5)} Da</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-xl font-semibold" htmlFor="size">
            Macrocycle size
          </label>
          <input
            id="size"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
            min={1}
            max={12}
            type="number"
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          />
          <p className="mt-3 text-sm text-slate-500">
            Current result count: {macrocycles.length}
          </p>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Manage monomers</h2>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            className="rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Name, e.g. Gly"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="rounded-xl border border-slate-300 px-4 py-3"
            inputMode="decimal"
            placeholder="Mass, e.g. 57.02146"
            value={mass}
            onChange={(event) => setMass(event.target.value)}
          />
          <button
            type="button"
            className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
            disabled={isSaving}
            onClick={submitMonomer}
          >
            {editingId ? "Save" : "Add"} monomer
          </button>
        </div>
        {error ? <p className="mb-4 text-sm font-medium text-red-600">{error}</p> : null}
        <div className="overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mass</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {monomers.map((monomer) => (
                <tr key={monomer.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{monomer.name}</td>
                  <td className="px-4 py-3 tabular-nums">{monomer.mass.toFixed(5)} Da</td>
                  <td className="space-x-2 px-4 py-3">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 px-3 py-1 text-sm"
                      onClick={() => {
                        setEditingId(monomer.id);
                        setName(monomer.name);
                        setMass(String(monomer.mass));
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-700"
                      onClick={() => removeMonomer(monomer)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-semibold">Possible macrocycles</h2>
        </div>
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-slate-100 text-sm uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-6 py-3">Composition</th>
                <th className="px-6 py-3">Mass</th>
              </tr>
            </thead>
            <tbody>
              {macrocycles.map((macrocycle) => (
                <tr key={macrocycle.formula} className="border-t border-slate-100">
                  <td className="px-6 py-3 font-medium">{macrocycle.formula}</td>
                  <td className="px-6 py-3 tabular-nums">{macrocycle.mass.toFixed(5)} Da</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
