/** Mirrors MetricPointDto: average and peak of the raw metrics in one bucket. */
export type MetricPoint = {
  /** Start of the bucket, UTC. */
  timestamp: string
  cpuAvg: number
  cpuMax: number
  memoryAvg: number
  memoryMax: number
  diskAvg: number
  diskMax: number
  responseTimeAvg: number
  responseTimeMax: number
  samples: number
}

/** Mirrors MetricsHistoryDto. Buckets without data are omitted. */
export type MetricsHistory = {
  serverId: number
  from: string
  to: string
  bucketMinutes: number
  points: MetricPoint[]
}

export type DiskUsage = {
  diskId: number
  driveLetter: string
  totalSpaceMB: number
  freeSpaceMB: number
  usedPercentage: number
  collectedAt: string
}

/** Mirrors LatestMetricsDto. */
export type LatestMetrics = {
  collectedAt: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  responseTimeMs: number
  status: string
  disks: DiskUsage[]
}
