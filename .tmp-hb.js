const fs = require('fs');

function replaceMethod(content, signature, newMethod) {
  const lines = content.split('\n');
  let start = -1;
  let braceCount = 0;
  let end = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(signature)) {
      start = i;
      braceCount = 0;
      for (let j = i; j < lines.length; j++) {
        braceCount += (lines[j].match(/{/g) || []).length;
        braceCount -= (lines[j].match(/}/g) || []).length;
        if (braceCount === 0 && j > i) { end = j; break; }
      }
      break;
    }
  }
  if (start === -1 || end === -1) { console.error('NOT FOUND:', signature); return content; }
  return [...lines.slice(0, start), ...newMethod.split('\n'), ...lines.slice(end + 1)].join('\n');
}

let c1 = fs.readFileSync('src/services/terminalSupabase.ts', 'utf8');

c1 = replaceMethod(c1, 'static async findByDeviceToken',
`  static async findByDeviceToken(token: string): Promise<TerminalDevice | null> {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('kiosks')
        .select('*')
        .eq('device_token', token)
        .maybeSingle()

      if (error || !data) return null

      const now = new Date()
      const lastBeat = data.last_heartbeat_at ? new Date(data.last_heartbeat_at) : null
      const HEARTBEAT_INTERVAL_MS = 25_000

      if (!lastBeat || now.getTime() - lastBeat.getTime() > HEARTBEAT_INTERVAL_MS) {
        const nowIso = now.toISOString()
        await supabase
          .from('kiosks')
          .update({ last_heartbeat_at: nowIso, status: 'online' })
          .eq('id', data.id)
        return mapRowToTerminal({ ...data, last_heartbeat_at: nowIso, status: 'online' })
      }

      return mapRowToTerminal(data)
    } catch {
      return null
    }
  }`);

c1 = replaceMethod(c1, 'static async fetchKiosks',
`  static async fetchKiosks(workspaceId?: string): Promise<TerminalDevice[] | null> {
    try {
      const supabase = getSupabase()
      const resolvedWsUuid = await resolveWorkspaceUuid(workspaceId)
      let query = supabase.from('kiosks').select('*').order('created_at', { ascending: false })
      if (resolvedWsUuid) query = query.eq('workspace_id', resolvedWsUuid)
      const { data, error } = await query
      if (error) {
        const fallback = await supabase.from('kiosks').select('*').order('created_at', { ascending: false })
        if (!fallback.error && fallback.data) return (fallback.data as KioskRow[]).map(mapRowToTerminal)
        return null
      }
      return (data as KioskRow[] || []).map(mapRowToTerminal)
    } catch {
      return null
    }
  }`);

fs.writeFileSync('src/services/terminalSupabase.ts', c1);
console.log('terminalSupabase.ts:', c1.split('\n').length, 'lines');

let c2 = fs.readFileSync('src/hooks/useTerminalAuth.ts', 'utf8');

c2 = c2.replace(
  "import { TerminalHardwareService } from '../services/terminalHardware'",
  "import { TerminalHardwareService } from '../services/terminalHardware'\nimport { TerminalSupabaseService } from '../services/terminalSupabase'"
);

c2 = c2.replace(
  '          })\n          return hardwareMatch',
  '          })\n          // Keep liveness consistent — conditional heartbeat (only writes if stale)\n          await TerminalSupabaseService.findByDeviceToken(hardwareMatch.deviceToken)\n          return hardwareMatch'
);

c2 = c2.replace(
  '    refetchInterval: 30000, // 30-second live heartbeat',
  `    refetchInterval: (query) => {
      // Pause heartbeat when tab is hidden — reduces DB writes
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false
      return 30000
    },`
);

fs.writeFileSync('src/hooks/useTerminalAuth.ts', c2);
console.log('useTerminalAuth.ts:', c2.split('\n').length, 'lines');
