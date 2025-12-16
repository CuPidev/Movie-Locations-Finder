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
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Filter by Topic:
            </p>
            <div className="flex flex-wrap gap-2">
                {clusters.map((cluster, idx) => {
                    const label = cluster.labels.join(", ");
                    const isSelected = selectedCluster === label;
                    return (
                        <button
                            key={idx}
                            onClick={() => onSelectCluster && onSelectCluster(label)}
                            disabled={!onSelectCluster}
                            className={`
                                px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                                ${isSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                                    : "bg-card/40 border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-card/80"
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
