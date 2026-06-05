# Macromasser Project

## Purpose

Macromasser is a small web application for exploring possible macrocycles assembled from a user-selected set of monomers.

Each monomer has an associated mass. A user will:

1. Select one or more available monomers.
2. Enter a macrocycle size, representing the total number of monomer positions in the macrocycle.
3. Generate all possible macrocycle compositions of that size using the selected monomers.
4. View the resulting macrocycles alongside their calculated total masses.

Monomers may repeat within a macrocycle. For example, given monomers `A`, `B`, and `C` and a size of `3`, valid macrocycles may include combinations such as `A-A-A`, `A-A-B`, `A-B-C`, `C-C-C`, and so on.

The initial goal is to provide a simple, fast, browser-based tool for enumerating possible macrocycle compositions and comparing their masses.

## Intended Architecture

### Hosting Platform

The application is intended to be hosted on **Cloudflare Workers**.

Cloudflare Workers is a good fit because the app is expected to be lightweight, computation-focused, and easy to deploy globally. The initial version should avoid unnecessary infrastructure and rely on Workers for serving the full-stack application.

### Full-Stack Framework

The project will use **TanStack Start** as the full-stack framework.

TanStack Start will provide:

- File-based routing
- Server-side rendering where useful
- Client-side interactivity
- Type-safe full-stack application structure
- A deployment path compatible with Cloudflare Workers

### Application Structure

The application should be organized around a small number of core concepts:

#### Monomer

A monomer represents an available building block.

Suggested fields:

```ts
type Monomer = {
  id: string
  name: string
  mass: number
}
```

#### Macrocycle

A macrocycle represents one possible composition generated from the selected monomers and requested size.

Suggested fields:

```ts
type Macrocycle = {
  monomers: Monomer[]
  formula: string
  mass: number
}
```

The `formula` may initially be a simple display string such as `A-A-B-C` or a grouped composition such as `A2-B1-C1`.

### Core Workflow

1. Load or define a list of available monomers.
2. Allow the user to select a subset of monomers.
3. Allow the user to enter a macrocycle size.
4. Generate every possible macrocycle composition for the selected monomers at the requested size.
5. Calculate the mass of each generated macrocycle.
6. Display the resulting list in a sortable or filterable table.

### Combination Logic

The app should generate combinations with repetition, since monomers can appear more than once.

An important product decision is whether macrocycles should be treated as:

- **Ordered sequences**, where `A-B-C` and `A-C-B` are distinct, or
- **Compositions/multisets**, where `A-B-C` and `A-C-B` are considered the same macrocycle composition.

The initial implementation should prefer **compositions/multisets** unless the domain later requires order-specific macrocycles. This avoids duplicate mass-equivalent entries and produces a more useful summary for comparison.

### Initial UI

The first version should include:

- A page title and short explanation
- A monomer selection interface
- A numeric input for macrocycle size
- A generate action, if generation is not automatic
- A results table showing:
  - Macrocycle composition
  - Total mass
  - Optional monomer counts

### Data Persistence

The initial version does not require persistent storage.

A default monomer list can be stored in source code or a static configuration file. Later versions may add:

- User-defined monomers
- Saved monomer libraries
- Import/export support
- Cloudflare D1 or KV-backed persistence

### Performance Considerations

The number of possible macrocycles grows quickly as the number of selected monomers and macrocycle size increase.

The application should include guardrails such as:

- Maximum macrocycle size
- Maximum number of selected monomers
- A warning before generating very large result sets
- Efficient generation of combinations with repetition

For the initial version, generation can likely run in the browser. If result sets become large or generation becomes expensive, the logic can move to a server function running on Cloudflare Workers.

### Deployment Intent

The app should be deployable to Cloudflare Workers using the TanStack Start Cloudflare deployment approach.

The intended deployment shape is:

- TanStack Start application source code
- Cloudflare Worker build output
- Cloudflare configuration via `wrangler`
- No database or external service dependency for the first release

### Future Enhancements

Potential future features include:

- User-created monomer libraries
- Import/export of monomer sets as CSV or JSON
- Sorting and filtering macrocycle results
- Mass range filtering
- Exact mass search
- Export results to CSV
- Support for adducts or charge states
- Support for ordered sequence enumeration if needed
- Server-side generation for larger computations
- Persistent storage using Cloudflare D1, KV, or R2

## Project Goal

The first milestone is a minimal deployed application where a user can select monomers, enter a macrocycle size, and view all generated macrocycle compositions with their calculated masses.
