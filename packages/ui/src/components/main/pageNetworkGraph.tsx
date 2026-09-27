"use client"

import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force"
import { useMemo, useRef, useState } from "react"

export type PageNetworkMetric = "views" | "visitors"

export interface PageNetworkNode {
  id: string
  label: string
  views: number
  visitors: number
  exits: number
}

export interface PageNetworkEdge {
  source: string
  target: string
  views: number
  visitors: number
}

interface PositionedNode extends PageNetworkNode, SimulationNodeDatum {
  color: string
}

interface Attachment {
  key: string
  angle: number
}

interface GraphEdgeGeometry {
  id: string
  source: string
  target: string
  path: string
  arrowPoints: string
  color: string
  views: number
  visitors: number
}

interface GraphLayout {
  nodes: PositionedNode[]
  edges: GraphEdgeGeometry[]
}

interface TooltipContent {
  title: string
  lines: string[]
  x: number
  y: number
}

const VIEWBOX_SIZE = 800
const NODE_RADIUS = 34
const MIN_ATTACHMENT_GAP = 0.18
const EDGE_WIDTH = 5
const TWO_PI = Math.PI * 2

const NODE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
  "var(--secondary)",
  "var(--accent)",
  "var(--destructive)",
  "color-mix(in srgb, var(--chart-1) 65%, var(--chart-2))",
  "color-mix(in srgb, var(--chart-2) 65%, var(--chart-3))",
  "color-mix(in srgb, var(--chart-3) 65%, var(--chart-4))",
  "color-mix(in srgb, var(--chart-4) 65%, var(--chart-5))",
  "color-mix(in srgb, var(--chart-5) 65%, var(--chart-1))",
  "color-mix(in srgb, var(--primary) 60%, var(--secondary))",
]

function normalizeAngle(angle: number) {
  return (angle + TWO_PI) % TWO_PI
}

function angleBetween(from: PositionedNode, to: PositionedNode) {
  return Math.atan2((to.y ?? 0) - (from.y ?? 0), (to.x ?? 0) - (from.x ?? 0))
}

function assignAttachmentAngles(attachments: Attachment[]) {
  if (attachments.length === 1)
    return new Map([[attachments[0]!.key, attachments[0]!.angle]])

  const ordered = attachments
    .map((attachment) => ({
      ...attachment,
      angle: normalizeAngle(attachment.angle),
    }))
    .sort((left, right) => left.angle - right.angle)

  let largestGap = -1
  let startIndex = 0
  for (let index = 0; index < ordered.length; index += 1) {
    const nextIndex = (index + 1) % ordered.length
    const nextAngle = ordered[nextIndex]!.angle + (nextIndex === 0 ? TWO_PI : 0)
    const gap = nextAngle - ordered[index]!.angle
    if (gap > largestGap) {
      largestGap = gap
      startIndex = nextIndex
    }
  }

  const aroundLargestGap = ordered
    .slice(startIndex)
    .concat(ordered.slice(0, startIndex))
    .map((attachment, index, list) => ({
      ...attachment,
      angle:
        attachment.angle +
        (index > 0 && attachment.angle < list[index - 1]!.angle ? TWO_PI : 0),
    }))
  for (let index = 1; index < aroundLargestGap.length; index += 1) {
    while (
      aroundLargestGap[index]!.angle < aroundLargestGap[index - 1]!.angle
    ) {
      aroundLargestGap[index]!.angle += TWO_PI
    }
  }

  const availableArc = Math.max(0, TWO_PI - largestGap)
  const gap = Math.min(
    MIN_ATTACHMENT_GAP,
    availableArc / Math.max(aroundLargestGap.length - 1, 1)
  )
  for (let index = 1; index < aroundLargestGap.length; index += 1) {
    aroundLargestGap[index]!.angle = Math.max(
      aroundLargestGap[index]!.angle,
      aroundLargestGap[index - 1]!.angle + gap
    )
  }

  return new Map(aroundLargestGap.map(({ key, angle }) => [key, angle]))
}

function arrowPoints(x: number, y: number, controlX: number, controlY: number) {
  const angle = Math.atan2(y - controlY, x - controlX)
  const length = 14
  const halfWidth = 6
  const baseX = x - Math.cos(angle) * length
  const baseY = y - Math.sin(angle) * length
  const perpendicularX = Math.cos(angle + Math.PI / 2) * halfWidth
  const perpendicularY = Math.sin(angle + Math.PI / 2) * halfWidth

  return `${x},${y} ${baseX + perpendicularX},${baseY + perpendicularY} ${baseX - perpendicularX},${baseY - perpendicularY}`
}

function createGraphLayout(
  nodes: PageNetworkNode[],
  edges: PageNetworkEdge[]
): GraphLayout {
  const positionedNodes: PositionedNode[] = nodes.map((node, index) => {
    const angle = (index / Math.max(nodes.length, 1)) * TWO_PI
    const initialRadius = Math.min(220, 70 + nodes.length * 8)
    return {
      ...node,
      color: NODE_COLORS[index % NODE_COLORS.length]!,
      x: VIEWBOX_SIZE / 2 + Math.cos(angle) * initialRadius,
      y: VIEWBOX_SIZE / 2 + Math.sin(angle) * initialRadius,
    }
  })

  const layoutLinks: SimulationLinkDatum<PositionedNode>[] = edges.map(
    (edge) => ({
      source: edge.source,
      target: edge.target,
    })
  )

  const simulation = forceSimulation<PositionedNode>(positionedNodes)
    .force(
      "link",
      forceLink<PositionedNode, SimulationLinkDatum<PositionedNode>>(
        layoutLinks
      )
        .id((node) => node.id)
        .distance(190)
        .strength(0.24)
    )
    .force("charge", forceManyBody<PositionedNode>().strength(-520))
    .force("center", forceCenter(VIEWBOX_SIZE / 2, VIEWBOX_SIZE / 2))
    .force(
      "collide",
      forceCollide<PositionedNode>(NODE_RADIUS + 30).iterations(3)
    )
    .force("x", forceX<PositionedNode>(VIEWBOX_SIZE / 2).strength(0.04))
    .force("y", forceY<PositionedNode>(VIEWBOX_SIZE / 2).strength(0.04))
    .stop()

  simulation.tick(220)

  for (const node of positionedNodes) {
    node.x = Math.max(
      NODE_RADIUS + 30,
      Math.min(VIEWBOX_SIZE - NODE_RADIUS - 30, node.x ?? VIEWBOX_SIZE / 2)
    )
    node.y = Math.max(
      NODE_RADIUS + 30,
      Math.min(VIEWBOX_SIZE - NODE_RADIUS - 30, node.y ?? VIEWBOX_SIZE / 2)
    )
  }

  const nodeById = new Map(positionedNodes.map((node) => [node.id, node]))
  const nodeAttachments = new Map(
    positionedNodes.map((node) => [node.id, [] as Attachment[]])
  )

  edges.forEach((edge, index) => {
    const source = nodeById.get(edge.source)
    const target = nodeById.get(edge.target)
    if (!source || !target) return

    nodeAttachments.get(source.id)!.push({
      key: `${index}:source`,
      angle: angleBetween(source, target),
    })
    nodeAttachments.get(target.id)!.push({
      key: `${index}:target`,
      angle: angleBetween(target, source),
    })
  })

  const attachmentPoints = new Map<string, { x: number; y: number }>()
  for (const node of positionedNodes) {
    const angles = assignAttachmentAngles(nodeAttachments.get(node.id) ?? [])
    for (const [key, angle] of angles) {
      attachmentPoints.set(key, {
        x: (node.x ?? 0) + Math.cos(angle) * NODE_RADIUS,
        y: (node.y ?? 0) + Math.sin(angle) * NODE_RADIUS,
      })
    }
  }

  const edgeKeys = new Set(
    edges.map((edge) => `${edge.source}\u0000${edge.target}`)
  )
  const graphEdges = edges.flatMap((edge, index) => {
    const source = nodeById.get(edge.source)
    const start = attachmentPoints.get(`${index}:source`)
    const end = attachmentPoints.get(`${index}:target`)
    if (!source || !start || !end) return []

    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.hypot(dx, dy) || 1
    const hasReverse = edgeKeys.has(`${edge.target}\u0000${edge.source}`)
    const bow = hasReverse ? 32 : ((index % 5) - 2) * 12
    const controlX = (start.x + end.x) / 2 - (dy / length) * bow
    const controlY = (start.y + end.y) / 2 + (dx / length) * bow

    return [
      {
        id: `${edge.source}->${edge.target}`,
        source: edge.source,
        target: edge.target,
        path: `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`,
        arrowPoints: arrowPoints(end.x, end.y, controlX, controlY),
        color: source.color,
        views: edge.views,
        visitors: edge.visitors,
      },
    ]
  })

  return { nodes: positionedNodes, edges: graphEdges }
}

function getNodeMark(label: string) {
  const segment = label.split(/[/?#]/).filter(Boolean).at(-1)
  return (
    segment?.charAt(0).toUpperCase() || label.charAt(0).toUpperCase() || "?"
  )
}

export function PageNetworkGraph({
  nodes,
  edges,
  metric,
}: {
  nodes: PageNetworkNode[]
  edges: PageNetworkEdge[]
  metric: PageNetworkMetric
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipContent | null>(null)
  const layout = useMemo(() => createGraphLayout(nodes, edges), [nodes, edges])

  function showTooltip(element: SVGElement, title: string, lines: string[]) {
    const container = containerRef.current?.getBoundingClientRect()
    const bounds = element.getBoundingClientRect()
    if (!container) return

    setTooltip({
      title,
      lines,
      x: bounds.left - container.left + bounds.width / 2,
      y: bounds.top - container.top + bounds.height / 2,
    })
  }

  if (nodes.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
        No pages found for this time range.
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto">
      <svg
        className="page-network-svg mx-auto block aspect-square h-auto w-full max-w-[800px] min-w-[640px]"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        role="group"
        aria-label="Page traffic network"
        onPointerLeave={() => setTooltip(null)}
      >
        {layout.edges.map((edge, index) => {
          const metricValue = metric === "views" ? edge.views : edge.visitors
          const metricLabel = metric === "views" ? "views" : "visitors"
          const tooltipLines = [
            `${metricValue.toLocaleString()} ${metricLabel}`,
          ]
          const source =
            nodes.find((node) => node.id === edge.source)?.label ?? edge.source
          const target =
            nodes.find((node) => node.id === edge.target)?.label ?? edge.target

          return (
            <g key={edge.id} className="page-network-edge-group">
              <path
                className="page-network-edge-hit"
                d={edge.path}
                tabIndex={0}
                role="img"
                aria-label={`${source} to ${target}: ${tooltipLines[0]}`}
                onPointerEnter={(event) =>
                  showTooltip(
                    event.currentTarget,
                    `${source} to ${target}`,
                    tooltipLines
                  )
                }
                onFocus={(event) =>
                  showTooltip(
                    event.currentTarget,
                    `${source} to ${target}`,
                    tooltipLines
                  )
                }
                onBlur={() => setTooltip(null)}
              >
                <title>{`${source} to ${target}: ${tooltipLines[0]}`}</title>
              </path>
              <path
                className="page-network-edge-visible"
                d={edge.path}
                pathLength={1}
                stroke={edge.color}
                strokeWidth={EDGE_WIDTH}
                style={{ animationDelay: `${Math.min(index * 24, 520)}ms` }}
              />
              <polygon
                className="page-network-edge-arrow"
                points={edge.arrowPoints}
                fill={edge.color}
              />
            </g>
          )
        })}

        {layout.nodes.map((node, index) => (
          <g
            key={node.id}
            className="page-network-node"
            style={{ animationDelay: `${Math.min(index * 35, 420)}ms` }}
            tabIndex={0}
            role="img"
            aria-label={`${node.label}: ${node.views.toLocaleString()} views, ${node.visitors.toLocaleString()} visitors, ${node.exits.toLocaleString()} exits`}
            onPointerEnter={(event) =>
              showTooltip(event.currentTarget, node.label, [
                `${node.views.toLocaleString()} views`,
                `${node.visitors.toLocaleString()} visitors`,
                `${node.exits.toLocaleString()} exits`,
              ])
            }
            onFocus={(event) =>
              showTooltip(event.currentTarget, node.label, [
                `${node.views.toLocaleString()} views`,
                `${node.visitors.toLocaleString()} visitors`,
                `${node.exits.toLocaleString()} exits`,
              ])
            }
            onBlur={() => setTooltip(null)}
          >
            <title>{node.label}</title>
            <circle
              className="page-network-node-circle"
              cx={node.x}
              cy={node.y}
              r={NODE_RADIUS}
              fill={node.color}
            />
            <text
              className="page-network-node-mark"
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {getNodeMark(node.label)}
            </text>
          </g>
        ))}
      </svg>

      {tooltip && (
        <div
          className="page-network-tooltip"
          role="status"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <strong>{tooltip.title}</strong>
          {tooltip.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      )}
    </div>
  )
}
