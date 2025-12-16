import React, { useState } from "react";

type Doc = { id?: string; title?: string; content?: string; [k: string]: any };
type Cluster = {
    labels: string[];
    doc_ids: string[];
    count: number;
    sample_docs?: Doc[];
};

export default function TopicCard({ cluster }: { cluster: Cluster }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [docs, setDocs] = useState<Doc[] | null>(null);

    const toggle = async () => {
        const next = !open;
        setOpen(next);
        if (next && docs == null) {
            // lazy load full docs for the cluster
            setLoading(true);
            try {
                const res = await fetch("/api/cluster-docs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: cluster.doc_ids }),
                });
                const data = await res.json();
                setDocs(data.results || []);
            } catch (err) {
                console.error("Failed to load cluster docs", err);
                setDocs([]);
            } finally {
                setLoading(false);
            }
        }
    };

    const headerLabel =
        cluster.labels && cluster.labels.length ? cluster.labels[0] : "Topic";

    return (
        <div
            className="topic-card"
            style={{ border: "1px solid #ddd", padding: 12, marginBottom: 8 }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <strong>{headerLabel}</strong>
                    <span style={{ marginLeft: 8, color: "#666" }}>
                        ({cluster.count})
                    </span>
                </div>
                <div>
                    <button onClick={toggle} style={{ padding: "4px 8px" }}>
                        {open ? "Collapse" : "Expand"}
                    </button>
                </div>
            </div>

            {open && (
                <div style={{ marginTop: 8 }}>
                    {loading && <div>Loading...</div>}

                    {!loading && docs && docs.length > 0 && (
                        <ul>
                            {docs.map((d) => {
                                const rawContent = (d && (d.content ?? d.contents)) || "";
                                const contentStr =
                                    typeof rawContent === "string"
                                        ? rawContent
                                        : rawContent && typeof rawContent === "object"
                                        ? JSON.stringify(rawContent)
                                        : String(rawContent || "");
                                const snippet = contentStr.substring(0, 200);
                                return (
                                    <li
                                        key={d.id || JSON.stringify(d)}
                                        style={{ marginBottom: 6 }}
                                    >
                                        <a href={d.id} target="_blank" rel="noreferrer">
                                            {d.title || d.id}
                                        </a>
                                        {snippet && (
                                            <div style={{ color: "#444" }}>{snippet}</div>
                                        )}
                                    </li>
                                );
                            })}
                            }
                        </ul>
                    )}

                    {!loading && docs && docs.length === 0 && (
                        <div>No documents found for this topic.</div>
                    )}

                    {!loading &&
                        docs == null &&
                        cluster.sample_docs &&
                        cluster.sample_docs.length > 0 && (
                            <div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "#666",
                                        marginBottom: 6,
                                    }}
                                >
                                    Sample results:
                                </div>
                                <ul>
                                    {cluster.sample_docs.map((d) => (
                                        <li key={d.id || JSON.stringify(d)}>
                                            <a
                                                href={d.id}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {d.title || d.id}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
}
