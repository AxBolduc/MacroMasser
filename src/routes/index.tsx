import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
  addMonomer,
  deleteMonomer,
  getMonomers,
  type Monomer,
  updateMonomer,
} from "../server/monomers";

const SODIUM_ADDUCT_MASS = 23;

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
      <header className="mb-10">
        <a href="/" className="group inline-flex items-baseline gap-0.5 font-bold tracking-tight">
          <span className="text-3xl text-slate-900 md:text-4xl">macro</span>
          <span className="bg-gradient-to-r from-cyan-500 to-sky-700 bg-clip-text text-3xl text-transparent md:text-4xl">
            masser
          </span>
          <span className="ml-1 align-baseline font-mono text-xs font-medium text-cyan-600/80">
            m/z
          </span>
        </a>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Pick a set of monomers and a macrocycle size — every composition with repetition is
          enumerated and ranked by mass. Manage the monomer library below.
        </p>
      </header>

      <section className="mb-8 grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Monomers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {monomers.map((monomer) => (
                <Label key={monomer.id} className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 hover:bg-muted/50">
                  <Checkbox
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
                    <span className="text-sm text-muted-foreground">{monomer.mass.toFixed(5)}</span>
                  </span>
                </Label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Macrocycle size</CardTitle>
            <CardDescription>Current result count: {macrocycles.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="size"
              className="h-12 text-lg"
              min={1}
              max={12}
              type="number"
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
            />
          </CardContent>
        </Card>
      </section>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Manage monomers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Input
              placeholder="Name, e.g. Gly"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              inputMode="decimal"
              placeholder="Mass, e.g. 57.02146"
              value={mass}
              onChange={(event) => setMass(event.target.value)}
            />
            <Button type="button" disabled={isSaving} onClick={submitMonomer}>
              {editingId ? "Save" : "Add"} monomer
            </Button>
          </div>
          {error ? (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="overflow-auto">
            <Table>
              <TableHeader className="bg-muted text-xs uppercase tracking-wide">
                <TableRow>
                  <TableHead className="px-4">Name</TableHead>
                  <TableHead className="px-4">Mass</TableHead>
                  <TableHead className="px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monomers.map((monomer) => (
                  <TableRow key={monomer.id}>
                    <TableCell className="px-4 font-medium">{monomer.name}</TableCell>
                    <TableCell className="px-4 tabular-nums">{monomer.mass.toFixed(5)}</TableCell>
                    <TableCell className="space-x-2 px-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(monomer.id);
                          setName(monomer.name);
                          setMass(String(monomer.mass));
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMonomer(monomer)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>Possible macrocycles</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[32rem] overflow-auto p-0">
          <Table>
            <TableHeader className="sticky top-0 bg-muted text-xs uppercase tracking-wide">
              <TableRow>
                <TableHead className="px-6">Composition</TableHead>
                <TableHead className="px-6">Mass</TableHead>
                <TableHead className="px-6">Mass + Na</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {macrocycles.map((macrocycle) => (
                <TableRow key={macrocycle.formula}>
                  <TableCell className="px-6 font-medium">{macrocycle.formula}</TableCell>
                  <TableCell className="px-6 tabular-nums">{macrocycle.mass.toFixed(5)}</TableCell>
                  <TableCell className="px-6 tabular-nums">
                    {(macrocycle.mass + SODIUM_ADDUCT_MASS).toFixed(5)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
