import { Session } from '@/types'

export const SESSIONS: Session[] = [
  {
    id: 's1',
    timeLabel: '2h ago',
    status: 'running',
    prompt: '每周一早 9 点给 platform 团队发本周 top 10 告警 + 当前 pod 健康状态',
    appId: 'team-alert-dashboard',
  },
  {
    id: 's2',
    timeLabel: 'Yesterday',
    status: 'deployed',
    prompt: 'Generate a chart showing weekly PR merge count by repo, grouped by author',
  },
  {
    id: 's3',
    timeLabel: '3d ago',
    status: 'draft',
    prompt: '当 namespace 里的 HPA 扩缩容超过 3 次 / 小时, 推送到飞书 oncall 群',
  },
  {
    id: 's4',
    timeLabel: 'Last week',
    status: 'shared',
    prompt: '每天早 8 点汇总昨日新增 issue 并按标签分类, 生成简报发给 PM',
  },
  {
    id: 's5',
    timeLabel: 'Last week',
    status: 'failed',
    prompt: 'Pull MySQL slow query log and summarize top 5 by avg exec time',
  },
  {
    id: 's6',
    timeLabel: '2 weeks ago',
    status: 'deployed',
    prompt: 'Kubernetes namespace 资源使用 TOP 10 可视化, 每 5 分钟刷新',
  },
]
