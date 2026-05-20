export function GroupedMatchList({ groupedMatches, partidosLength }) {
  const groupEntries = Object.entries(groupedMatches);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 bg-secondary skew-x-[-15deg]" />
        <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">
          Encuentros ({partidosLength})
        </p>
      </div>

      {groupEntries.length > 0 ? (
        <div className="space-y-2">
          {groupEntries.map(([groupName, groupMatches]) => (
            <div key={groupName} className="space-y-2">
              {groupName !== "General" && (
                <div className="px-2 pt-2 pb-1">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                    {groupName}
                  </span>
                </div>
              )}
              {groupMatches.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-bg-deep/50 border border-white/5 hover:border-primary/30 transition-all"
                >
                  <div className="flex-1 flex items-center justify-between min-w-0 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-1.5 h-6 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            p.equipo_local?.color_principal || "#CEDE0B",
                        }}
                      />
                      <span className="text-[11px] font-black uppercase italic tracking-wide truncate">
                        {p.equipo_local?.nombre}
                      </span>
                    </div>
                    <div className="px-2 text-[9px] font-black text-primary italic shrink-0">
                      VS
                    </div>
                    <div className="flex items-center gap-2 min-w-0 text-right justify-end">
                      <span className="text-[11px] font-black uppercase italic tracking-wide truncate">
                        {p.equipo_visitante?.nombre}
                      </span>
                      <div
                        className="w-1.5 h-6 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            p.equipo_visitante?.color_principal || "#ffffff",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-white/2 rounded-2xl border border-dashed border-white/10">
          <p className="text-[10px] font-black text-text-dim uppercase tracking-widest italic">
            Vacío
          </p>
        </div>
      )}
    </div>
  );
}
