/**
 * Dev-Server-Starter mit erhöhtem Node-Heap.
 *
 * Hintergrund: Beim ersten Kaltkompilieren schwerer Routen (viele Imports)
 * können die Next-Compile-Worker (jest-worker) unter Speicherdruck sterben
 * ("Jest worker encountered N child process exceptions, exceeding retry limit").
 * Ein größerer Heap entschärft das (siehe Memory turbopack-oom-cascade).
 *
 * Der Wert ist via WIMUS_DEV_HEAP_MB überschreibbar.
 */
import { spawn } from "node:child_process"

const heap = process.env.WIMUS_DEV_HEAP_MB || "4096"
const prefix = process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ""
process.env.NODE_OPTIONS = `${prefix}--max-old-space-size=${heap}`

// Kommando als ein String (kein Args-Array) bei shell:true → keine DEP0190-Warnung.
const child = spawn("next dev --webpack", {
  stdio: "inherit",
  shell: true,
  env: process.env,
})
child.on("exit", (code) => process.exit(code ?? 0))
