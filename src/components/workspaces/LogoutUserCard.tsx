import { Badge } from '../ui'

interface LogoutUserCardProps {
  displayName: string
  email: string
  initials: string
  avatarUrl?: string
  role: string
}

export function LogoutUserCard({
  displayName,
  email,
  initials,
  avatarUrl,
  role,
}: LogoutUserCardProps) {
  return (
    <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-3 flex items-center gap-3 mb-5">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-10 h-10 rounded-full object-cover border border-zinc-200 shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#7c007e] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1 text-left">
        <p className="text-xs font-bold text-zinc-900 truncate leading-tight">{displayName}</p>
        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{email}</p>
        <div className="mt-1">
          <Badge variant="purple" size="sm">
            {role.toUpperCase()}
          </Badge>
        </div>
      </div>
    </div>
  )
}
