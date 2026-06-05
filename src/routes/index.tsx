import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

type Monomer = {
  id: string;
  name: string;
  mass: number;
};

type Macrocycle = {
  formula: string;
  mass: number;
  counts: Record<string, number>;
};

const monomers: Monomer[] = [
  { id: "gly", name: "Gly", mass: 57.02146 },
  { id: "ala", name: "Ala", mass: 71.03711 },
  { id: "ser", name: "Ser", mass: 87.03203 },
  { id: "val", name: "Val", mass: 99.06841 },
  { id: "phe", name: "Phe", mass: 147.06841 },
];

export const Route = createFileRoute("/")({
  component: App,
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
  const [selectedIds, setSelectedIds] = useState(() => monomers.map((monomer) => monomer.id));
  const [size, setSize] = useState(3);

  const selectedMonomers = useMemo(
    () => monomers.filter((monomer) => selectedIds.includes(monomer.id)),
    [selectedIds],
  );

  const macrocycles = useMemo(
    () => generateMacrocycles(selectedMonomers, size),
    [selectedMonomers, size],
  );

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
          The starter app treats macrocycles as unordered compositions, not order-specific sequences.
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
