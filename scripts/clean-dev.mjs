// Beendet verwaiste Next-Dev-Prozesse *dieses* Projekts, bevor ein neuer Start erfolgt.
// Verhindert die Prozess-Lawine (mehrere parallele next-dev -> OOM-Kaskade).
// Plattformübergreifend, killt NUR node-Prozesse, deren Kommandozeile diesen Projektpfad enthält.
import { execSync } from "node:child_process"

const cwd = process.cwd()
const self = process.pid
const isWin = process.platform === "win32"

function killWindows() {
  // CommandLine-basiert filtern: nur next-dev dieses Verzeichnisses.
  // Keine inneren Double-Quotes, damit das Quoting durch powershell -Command sauber bleibt.
  const ps = [
    "Get-CimInstance Win32_Process",
    `| Where-Object { $_.Name -eq 'node.exe' -and $_.ProcessId -ne ${self} -and $_.CommandLine -like '*next*' -and $_.CommandLine -like '*${cwd}*' }`,
    "| ForEach-Object { Write-Output $_.ProcessId; Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
  ].join(" ")
  const out = execSync(`powershell -NoProfile -Command "${ps}"`, { encoding: "utf8" }).trim()
  return out ? out.split(/\r?\n/).filter(Boolean) : []
}

function killUnix() {
  try {
    const out = execSync(
      `pgrep -f 'next' | xargs -r -I{} sh -c 'grep -lq "${cwd}" /proc/{}/environ 2>/dev/null && echo {}'`,
      { encoding: "utf8" }
    ).trim()
    const pids = out ? out.split(/\r?\n/).filter((p) => p && Number(p) !== self) : []
    pids.forEach((p) => execSync(`kill -9 ${p} 2>/dev/null || true`))
    return pids
  } catch {
    return []
  }
}

const killed = isWin ? killWindows() : killUnix()
if (killed.length) {
  console.log(`[clean-dev] ${killed.length} verwaiste Dev-Prozess(e) beendet: ${killed.join(", ")}`)
} else {
  console.log("[clean-dev] keine verwaisten Dev-Prozesse gefunden")
}
