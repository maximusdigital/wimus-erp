/**
 * Zentrale Such-Konfiguration (Modul 006) – Schwellen/Limits an EINER Stelle,
 * justierbar ohne Code-Änderung an der Engine (analog Bank-Abgleich-Schwellen).
 */
export const SEARCH_CONFIG = {
  /** Trigram-Ähnlichkeitsschwelle (Roadmap: similarity() via RPC). */
  trigramThreshold: 0.3,
  /** Treffer je Entität in der globalen Suche (Fan-out). */
  perEntityLimit: 5,
  /** Gesamt-Treffer der globalen Suche. */
  globalLimit: 30,
  /** Debounce der Eingabe (ms). */
  debounceMs: 250,
  /** Mindest-Eingabelänge, bevor gefeuert wird. */
  minQueryLength: 2,
} as const
