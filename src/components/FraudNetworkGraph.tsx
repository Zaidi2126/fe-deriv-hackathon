import type { FraudNetworkNode, FraudNetworkEdge } from '../api/client';

const LINK_COLORS: Record<string, string> = {
  payment_method: '#dc2626',
  ip_address: '#2563eb',
  device_id: '#16a34a',
};

function layoutNodes(nodes: FraudNetworkNode[], width: number, height: number): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const n = nodes.length;
  if (n === 0) return pos;
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.35;
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    pos.set(node.user_id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  });
  return pos;
}

export function FraudNetworkGraph({
  nodes,
  edges,
  width = 500,
  height = 400,
}: {
  nodes: FraudNetworkNode[];
  edges: FraudNetworkEdge[];
  width?: number;
  height?: number;
}) {
  const positions = layoutNodes(nodes, width, height);

  return (
    <div className="rounded border border-gray-200 bg-white overflow-hidden">
      <svg width={width} height={height} className="block">
        {edges.map((e, i) => {
          const from = positions.get(e.from);
          const to = positions.get(e.to);
          if (!from || !to) return null;
          const color = LINK_COLORS[e.link_type] ?? '#6b7280';
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={color}
              strokeWidth={2}
              strokeOpacity={0.8}
            />
          );
        })}
        {nodes.map((node) => {
          const p = positions.get(node.user_id);
          if (!p) return null;
          return (
            <g key={node.user_id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={24}
                fill="#f3f4f6"
                stroke="#374151"
                strokeWidth={2}
              />
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill="#111827"
                className="font-medium"
              >
                {(node.label || node.user_id).length > 12
                  ? (node.label || node.user_id).slice(0, 10) + '…'
                  : node.label || node.user_id}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 px-3 py-2 border-t border-gray-200 text-xs text-gray-600">
        <span><span className="inline-block w-3 h-0.5 bg-red-500 align-middle mr-1" /> payment_method</span>
        <span><span className="inline-block w-3 h-0.5 bg-blue-600 align-middle mr-1" /> ip_address</span>
        <span><span className="inline-block w-3 h-0.5 bg-green-600 align-middle mr-1" /> device_id</span>
      </div>
    </div>
  );
}
