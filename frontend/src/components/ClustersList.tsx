interface Cluster {
    labels: string[];
    docs: string[];
}

interface ClustersListProps {
    clusters: Cluster[];
    selectedCluster: string | null;
    onSelectCluster: (clusterLabel: string) => void;
}

export default function ClustersList({ clusters, selectedCluster, onSelectCluster }: ClustersListProps) {
    if (!clusters || clusters.length === 0) return null;

    return (
        <div className="mb-6 animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                Filter by Topic:
            </p>
            <div className="flex flex-wrap gap-2">
                {clusters.map((cluster, idx) => {
                    const label = cluster.labels.join(", ");
                    const isSelected = selectedCluster === label;
                    return (
                        <button
                            key={idx}
                            onClick={() => onSelectCluster(label)}
                            className={`
                                px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border
                                ${isSelected
                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 hover:border-white/20'
                                }
                            `}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
