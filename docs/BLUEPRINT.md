# Forge Prototype — Blueprint

**Version**: Draft v0.2 · **Date**: 2026-04-22 · **Owner**: samzong

---

## 0. 本文档的作用

这是**完整建设框架**：所有页面、所有实体、优先级、Sprint 顺序、Mock
Seed 要求、已决策事项都在此。每次开发前回到这份文档确认当前处于哪一步。

和 `CLAUDE.md` 的分工：

| 文件 | 给谁看 | 管什么 |
|---|---|---|
| `CLAUDE.md` | AI agent（硬规则） | 架构边界、代码约束、验证命令 |
| `docs/BLUEPRINT.md`（本文件） | 开发者（自己） | 建什么、先建什么、每个东西的字段与边界 |

两份配合。CLAUDE.md 说"不要做什么"，BLUEPRINT 说"要做什么"。

---

## 1. 原则

### 1.1 深度 vs 宽度

**先深后宽，但宽度不丢**。每个页面在本文档里都有名字和优先级；即使
P2 的页还没实现，也不是"忘了做"，是"按计划晚做"。

- **P0 — 深度**：My App 全生命周期做透（创建 → 运行 → 版本 → 回滚 →
  审计）。演示价值最高，也最能暴露实体模型缺陷。
- **P1 — 宽度**：市场 / 分享 / 会话 / 个人设置。铺开后，产品形态基本成形。
- **P2 — 补齐**：认证、团队管理、平台 admin、错误页。
- **P3 — 延后**：Budget 等现在不处理的。

### 1.2 多租户模型（v0.2 新增）

Forge 是**多租户平台**。基本假设：

- 一个租户（Tenant）= 一个企业客户的 Forge 部署实例（例如 Acme 公司）
- 租户间**完全隔离**。不存在一个账号跨租户的情况；A 公司和 B 公司的
  用户、App、Session、审计都互不可见
- 每个租户内：租户级 admin 可管账号 / 团队；team-manager 管团队内；user 是普通成员
- 一个 user 可以**在同一租户内属于多个团队**
- Mock 只演示**单租户**（`tenantId='acme'`），但所有业务实体都带
  `tenantId` 字段，保证将来多租户切换不改模型

### 1.3 取舍规则

1. 业务规则空白 → 先提出来讨论，不擅自决定（§7 已清空，后续遇到新的
   再开条目）。
2. 不确定字段用 `[TBD]` 标注；Seed 里用合理示例值填，但标注为假设。
3. Mock 就是产品真相——mock 里存在的 UI 交互和数据关系，才算存在。
4. 所有实体字段用 camelCase + ISO 8601 timestamp；不做 snake_case 妥协。
5. 不为"未来可能的扩展"预留字段。字段在有 consumer 时才加。
6. **界面和 seed 数据使用英文**；Session prompt 允许中英混排（贴近
   真实用户输入场景）。

### 1.4 Prototype boundary（来自 CLAUDE.md）

- UI + Mock 数据，不接真实后端
- 没有 `src/api/` 层、没有 service interface、没有 DTO/UI 双层
- 所有 mock 走 Promise + 真实 CRUD + 延迟 + 错误注入
- 页面只通过 hooks 访问数据，不直连 mock 数组

---

## 2. 实体模型 (Entities)

### 2.1 实体优先级矩阵

| # | 实体 | 优先级 | 当前状态 | 一句话定义 |
|---|---|---|---|---|
| 1 | Tenant | P0 | 新增 | 租户（企业部署实例） |
| 2 | User | P0 | 新增 | 当前登录用户 |
| 3 | App | P0 | 已有（改造） | U App 实例 |
| 4 | AppVersion | P0 | 新增 | App 的历史版本 |
| 5 | AppManifest | P0 | 新增 | App 的声明（capabilities/cron/identity） |
| 6 | Session | P0 | 已有（改造） | 一次 prompt → 生成会话 |
| 7 | SessionStage | P0 | 新增 | 会话的单个 stage（7 个） |
| 8 | Execution | P0 | 新增 | App 的单次运行 |
| 9 | ExecutionLog | P0 | 新增 | 运行过程日志 |
| 10 | Capability | P0 | 部分（字符串） | 权限能力点 |
| 11 | Integration | P1 | 新增 | 接入源（DCE/GitHub/Feishu…） |
| 12 | MarketplaceListing | P1 | 部分（字段） | Marketplace 上架条目 |
| 13 | Share | P1 | 新增 | 分享关系（给个人 / 团队） |
| 14 | AuditEvent | P1 | 新增 | 审计事件 |
| 15 | ApiToken | P1 | 新增 | CLI / API token |
| 16 | Notification | P1 | 新增 | 通知记录 |
| 17 | DeliveryChannel | P1 | 新增 | 交付渠道（飞书/Webhook） |
| 18 | Team | P2 | 新增 | 团队 |
| 19 | Policy | P2 | 新增 | 策略规则（数据/egress/成本） |
| 20 | Budget | **P3 延后** | 新增 | 团队预算（先不处理） |

**删除**：`HostSystem` — 已并入 `Tenant.hostSystemKind`。

**Role 不再是实体**：降级为 union type `'user' | 'team-manager' | 'admin'`。

### 2.2 P0 实体字段定义

以下是 P0 实体的 TypeScript 定义。Sprint 0/1 会把这些落到
`src/types.ts`。

#### 2.2.1 Tenant

```ts
type HostSystemKind = 'dce' | 'crm' | 'hr'
type TenantStatus = 'active' | 'suspended'

interface Tenant {
  id: string                         // 'acme'
  name: string                       // 'Acme Corporation'
  hostSystemKind: HostSystemKind     // 部署宿主
  status: TenantStatus
  createdAt: string                  // ISO
}
```

**Mock seed 要求**：≥1（仅 'acme'，原型不演示租户切换）。

#### 2.2.2 User

```ts
type Role = 'user' | 'team-manager' | 'admin'

interface User {
  id: string
  tenantId: string                   // 所属租户
  username: string                   // 'samzong'
  displayName: string                // 'Samzong Lu'
  email: string
  avatar?: string                    // URL 或 initials fallback
  primaryTeamId: string              // 首要团队
  teamIds: string[]                  // 所属所有团队（多团队）
  roles: Role[]                      // 跨团队角色列表
  createdAt: string
}
```

**Mock seed 要求**：≥3（自己 + 1 个同团队同事 + 1 个跨团队但同租户）。

#### 2.2.3 App

```ts
type AppViewKind = 'dashboard' | 'notifier' | 'report' | 'form' | 'bot'
type AppStatus = 'draft' | 'running' | 'stopped' | 'failed' | 'deployed'
type AppGroup = 'mine' | 'shared' | 'marketplace'
type AppSource = 'dce-official' | 'community' | 'private'

interface App {
  id: string
  tenantId: string
  name: string
  icon: string                       // 2-char display icon: 'BC'
  description: string
  status: AppStatus
  group: AppGroup
  viewKind: AppViewKind              // 决定 preview tab 用哪个渲染器

  ownerId: string                    // User.id
  teamId?: string

  currentVersion: string             // 'v1.2' — points to latest AppVersion
  capabilities: string[]             // ['dce:alerts:read', ...]

  createdAt: string
  updatedAt: string
  lastRunAt?: string

  // 分享 / fork 关系
  sharedWithUserIds?: string[]
  sharedWithTeamIds?: string[]
  relation?: 'subscribed' | 'forked' // 仅当出现在 'shared' 分组时
  forkedFromAppId?: string
  forkedFromVersionId?: string       // fork 时 upstream 所在版本

  // Marketplace
  stars?: number
  source?: AppSource
  publishedAt?: string
}
```

**字段变更 vs v0.1**：
- 加 `tenantId`（多租户）
- 加 `viewKind`（决定详情页 preview tab 的渲染器）
- 加 `forkedFromVersionId`（git-style fork，支持未来手动 sync）
- **删 `embedUrl`** — cockpit 改为 `viewKind='dashboard'` 的原生 React 实现（Sprint 3.5）

**viewKind 说明**：`preview` tab 按 viewKind 分发到对应渲染器。
每种 viewKind 有一个实现类，列表随产品演进扩展：
- `dashboard`: 多指标卡片 + 图表（cockpit, team-alert-dashboard）
- `notifier`: 定时推送到渠道（pr-review-bot, k8s-ns-watcher）
- `report`: 周期报告生成（weekly-sales-report, release-notes-gen）
- `form`: 表单提交 + 流转（hr-leave-request）
- `bot`: 交互式机器人（code-review-helper, bug-triage-bot）

**状态机**：
- `draft` → `running` （首次 deploy）
- `running` ⇄ `stopped` （暂停/恢复）
- 任意 → `failed` （运行态异常；可修复重跑）
- `marketplace.group` 的 App 恒为 `deployed`（只读态）

**Mock seed 要求**：≥20，分布：
- mine: 10（覆盖 draft/running/stopped/failed、viewKind 多样化、长短名）
- shared: 5（subscribed 3 + forked 2；至少 1 个含 `forkedFromVersionId`）
- marketplace: 8（dce-official 3 + community 5，star 从 12 到 12k）

#### 2.2.4 AppVersion + AppManifest

```ts
interface AppVersion {
  id: string
  tenantId: string
  appId: string
  version: string                    // 'v1.2'
  createdAt: string
  createdBy: string                  // User.id
  sessionId?: string                 // 源 Session（若由 prompt 生成）

  manifest: AppManifest              // 结构化
  handlerSource: string              // TypeScript 源码

  changeNote?: string
  isRollback?: boolean
  rolledBackFromVersionId?: string
}

interface AppManifest {
  runtimeIdentity: 'invoker' | 'service-account'
  capabilities: string[]
  schedule?: string                  // cron: '0 9 * * MON'
  triggers?: TriggerDef[]
  dataRetention?: 'none' | '7d' | '30d' | '90d'  // 可选，默认不展示
}

interface TriggerDef {
  type: 'webhook' | 'schedule' | 'event'
  config: Record<string, unknown>
}
```

**Mock seed 要求**：每个 mine/shared App 平均 3 个版本；含 rollback 链路；
changeNote 英文。

#### 2.2.5 Session + SessionStage

```ts
type SessionStatus = 'running' | 'completed' | 'failed' | 'cancelled'
type StageName = 'parse' | 'scope' | 'generate' | 'scan' | 'policy' | 'sandbox' | 'deploy'
type StageStatus = 'pending' | 'running' | 'passed' | 'warning' | 'failed'

interface Session {
  id: string
  tenantId: string
  prompt: string                     // 允许中英混排
  status: SessionStatus
  createdBy: string                  // User.id
  createdAt: string
  finishedAt?: string
  resultAppId?: string               // 成功时关联
  resultVersionId?: string
  stages: SessionStage[]
}

interface SessionStage {
  name: StageName
  status: StageStatus
  startedAt?: string
  finishedAt?: string
  artifact?: StageArtifact
  warnings?: string[]
  errorMessage?: string
}

type StageArtifact =
  | { type: 'intent'; json: Record<string, unknown> }
  | { type: 'scope'; granted: CapDecision[]; denied: CapDecision[] }
  | { type: 'code'; manifestYaml: string; handlerTs: string }
  | { type: 'scan'; checks: SecurityCheck[] }
  | { type: 'policy'; checks: PolicyCheck[]; verdict: 'auto' | 'manual' | 'denied' }
  | { type: 'sandbox'; logs: LogLine[]; exitCode: number; durationMs: number }
  | { type: 'deploy'; buildId: string; artifactUri: string; signed: boolean }

interface CapDecision { cap: string; reason: string }
interface SecurityCheck { label: string; result: 'pass' | 'warn' | 'fail'; detail: string }
interface PolicyCheck { key: string; value: string; ok: boolean; note: string }
interface LogLine { t: string; tag: string; msg: string }
```

**Scope 阶段的交互约定**（Q4 决策）：AI 推断出 granted/denied 列表，
用户在 UI 上点 "Confirm & proceed" 即可，不需要逐项勾选。

**Mock seed 要求**：≥15 Session，覆盖：
- 完整 7 stage 成功路径 × 8（其中一个 `resultAppId='biz-cockpit'`，
  体现 cockpit 是被生成出来的，而非特殊 hardcoded）
- scan 出现 warning × 2
- policy 被拒 × 1
- sandbox 失败 × 2
- 进行到一半 cancelled × 1
- 纯 draft（只到 parse） × 1

#### 2.2.6 Execution + ExecutionLog

```ts
type ExecutionStatus = 'running' | 'succeeded' | 'failed' | 'timeout' | 'cancelled'
type ExecutionTrigger = 'manual' | 'schedule' | 'webhook' | 'test'

interface Execution {
  id: string
  tenantId: string
  appId: string
  versionId: string
  status: ExecutionStatus
  trigger: ExecutionTrigger
  triggeredBy?: string               // User.id (manual) or 'system'
  startedAt: string
  finishedAt?: string
  durationMs?: number
  exitCode?: number
  outputSummary?: string
  errorMessage?: string
}

interface ExecutionLog {
  executionId: string
  timestamp: string                  // ISO ms
  level: 'debug' | 'info' | 'warn' | 'error'
  tag: 'sandbox' | 'runtime' | 'cli' | 'render' | 'result' | 'user'
  message: string
}
```

**Mock seed 要求**：前 3 个 mine App 各 ≥30 execution 历史；
覆盖 failed × 3、timeout × 2、running 态 × 1（real-time 感）。

#### 2.2.7 Capability

```ts
type CapAction = 'read' | 'write' | 'watch' | 'send' | 'delete'
type CapRisk = 'low' | 'medium' | 'high'

interface Capability {
  id: string                         // 'dce:alerts:read'
  tenantId: string                   // 即使平台级能力也归某租户（隔离强一致）
  displayName: string                // 'Read DCE alerts'（英文）
  category: string                   // 'dce' | 'feishu' | 'github' | ...
  action: CapAction
  description: string
  integrationId: string              // Integration.id
  risk: CapRisk
  deprecated?: boolean
}
```

**Mock seed 要求**：≥40 条，覆盖 5 个主要 category
（dce / crm / hr / feishu / github）——移除 dingtalk / email / sms
相关（Q7 决策：先做飞书 + webhook；webhook 是通用出口不是 capability）。

### 2.3 P1 / P2 实体骨架

P1/P2 实体在对应 Sprint 开始前才展开完整字段；目前只列最少的关键字段。

```ts
// P1
interface Integration { id; tenantId; name; kind; status; iconUrl }
interface MarketplaceListing { appId; tenantId; publishedAt; stars; forks; reviews }
interface Share { id; tenantId; appId; sharedBy; sharedWith; kind: 'user'|'team'; permission }
interface AuditEvent { id; tenantId; actorId; action; target; timestamp; metadata }
interface ApiToken { id; tenantId; ownerId; label; prefix; createdAt; lastUsedAt; scopes }
interface Notification { id; tenantId; userId; kind; title; body; read; createdAt }
interface DeliveryChannel { id; tenantId; userId; kind: 'feishu'|'webhook'; config }

// P2
interface Team { id; tenantId; name; ownerId; createdAt }
interface Policy { id; tenantId; kind; rule; action: 'warn'|'block' }

// P3（延后）
interface Budget { tenantId; teamId; monthlyLimit; currentSpend; currency }
```

### 2.4 关系图

```
Tenant ──has_many──> User
 │        │
 │        ├──owns──> App ──has_many──> AppVersion
 │        │          │
 │        │          ├──generates──> Execution ──has_many──> ExecutionLog
 │        │          ├──requires──> Capability ──provided_by──> Integration
 │        │          └──published_as──> MarketplaceListing
 │        │
 │        ├──creates──> Session ──deploys_to──> App (via session.resultAppId)
 │        └──triggers──> AuditEvent
 │
 └──has_many──> Team ──enforces──> Policy
```

所有业务实体均有 `tenantId`。Mock 层在每次 list/get 时按
`currentUser.tenantId` 过滤（原型内只有一个租户，实际只是保底）。

---

## 3. 页面全景 (Page Inventory)

**合计 42 个 route**。按优先级分层。

### 3.1 P0 — My App 全生命周期（16 页）

#### 3.1.1 `/` — Home（Galaxy + Prompt）
**现状**：已有。
**数据依赖**：`useSatellites()` / `useSessions({ scope: 'recent', limit: 6 })`
**交互**：点 satellite → seed prompt；输入 → 回车跳 `/generate?q=...`
**边界**：网络慢时 satellite 动画不阻塞；prompt 为空时提交按钮 disabled
**Sprint**：1

#### 3.1.2 `/generate?q=...` — 生成管线
**现状**：已有（硬编码 7 stage + 固定时序）。
**改造**：提交后 **不是本地 setTimeout 模拟**，而是调 mock createSession，
store 按 50–300ms × 7 的节奏推进 stage，页面通过 `useSession(id)` 订阅。
**scope stage 交互**：granted/denied 列表展示 + "Confirm & proceed" 按钮。
**边界**：stage failed → 管线中断 + 错误详情；policy denied → 阻断在 policy；
scan warning → 可继续但标警告。
**Sprint**：3

#### 3.1.3 `/generate/:sessionId` — 历史会话重放
**用途**：打开已完成的 session，管线不再跑，所有 stage artifact 静态展示。
**数据依赖**：`useSession(id)`
**交互**：点 stage tab 看对应 artifact；底部按钮 "Open resulting app"
跳 `/apps/:resultAppId`
**Sprint**：3

#### 3.1.4 `/apps` — 我的应用列表（独立页）
**用途**：Sidebar 有简略列表，但**独立页**可以排序、筛选、搜索、多选批量操作。
**数据依赖**：`useApps({ group: 'mine', filter, sort, page, size })`
**交互**：卡片 / 列表视图切换；按 status / updatedAt 排序；按 name / viewKind /
capability 搜索；多选 → 批量 stop / delete
**边界**：empty（新用户）→ "Create your first app" CTA；筛选无结果 → 空态；
分页 → >30 条触发
**Sprint**：2

#### 3.1.5 `/apps/:id` — 应用详情（默认 overview tab）
**现状**：已有三视图（embed / usage / install），近千行。
**改造**：
- 按 `?tab=<name>` 切视图；tab 状态进 url，刷新保留
- `useApp(id)` 替代 `APPS.find()`
- **删 EmbedView 分支**——`embedUrl` 字段消失后，cockpit 走普通路径
- marketplace 的 install 视图保留为"未安装时的落地页"

#### 3.1.6 `/apps/:id?tab=overview`
**默认 tab**。展示：当前版本、最近执行、关键指标 sparkline、capability 列表、
交付渠道、下次定时运行时间。
**数据依赖**：`useApp(id)` + `useExecutions({ appId, limit: 10 })` +
`useNextSchedule(id)`

#### 3.1.7 `/apps/:id?tab=preview` — viewKind 渲染器
**新增（v0.2）**。按 `app.viewKind` 分发到对应渲染器：
- `dashboard` → `<DashboardRenderer app={app} />`（cockpit 的重写目标）
- `notifier` → `<NotifierRenderer app={app} />`
- `report` → `<ReportRenderer app={app} />`
- `form` → `<FormRenderer app={app} />`
- `bot` → `<BotRenderer app={app} />`
渲染器用 mock 数据驱动（未来会接 execution output）。
**Sprint**：2（骨架）+ 3.5（dashboard renderer 实现）

#### 3.1.8 `/apps/:id?tab=code`
展示当前版本的 handler.ts 源码；只读，带行号和语法高亮。
**数据依赖**：`useAppVersion(app.currentVersionId)`

#### 3.1.9 `/apps/:id?tab=manifest`
展示当前版本的 manifest（cron、capabilities、retention）；只读。
**数据依赖**：同上

#### 3.1.10 `/apps/:id?tab=executions`
执行历史列表：时间、触发方式、状态、耗时、退出码；可点进详情。
**数据依赖**：`useExecutions({ appId, page, size })`
**分页**：默认 25/页；"running" 态每 3s 轮询（mock 下用 interval）

#### 3.1.11 `/apps/:id?tab=versions`
版本历史：时间、版本号、变更说明、创建者、是否 rollback；可点进详情。
**数据依赖**：`useAppVersions({ appId })`
**交互**：任意历史版本 → "Rollback to this version" 按钮 → 确认 modal
**Fork 场景**：若 `app.forkedFromAppId` 存在，顶部显示
"Forked from X at Y · upstream is now Z" + "Sync from upstream" 按钮

#### 3.1.12 `/apps/:id?tab=logs`
实时日志流（最近一次 execution 的 live log）。
**数据依赖**：`useExecutionLogs({ executionId, tail: true })`
**交互**：filter by level；pause/resume autoscroll；download logs

#### 3.1.13 `/apps/:id?tab=audit`
App 维度审计事件：谁 deploy 的、谁 rollback 的、谁改了 capability、
谁 stop 的。**保留 180 天**，不提供导出。
**数据依赖**：`useAuditEvents({ targetType: 'app', targetId: id })`

#### 3.1.14 `/apps/:id?tab=settings`
配置：名称、描述、图标、capabilities（可增删）、交付渠道、schedule、
dataRetention（折叠在高级设置）、danger zone（stop / delete）
**数据依赖**：`useApp(id)` + `useUpdateApp()` + `useDeleteApp()`

#### 3.1.15 `/apps/:id/executions/:eid` — 单次执行详情
完整 execution 详情 + 完整 log stream。
**数据依赖**：`useExecution(eid)` + `useExecutionLogs({ executionId: eid })`

#### 3.1.16 `/apps/:id/versions/:vid` — 版本详情 / diff
版本完整信息 + 与当前版本的 diff（manifest diff + handler diff）。
**数据依赖**：`useAppVersion(vid)` + `useAppVersion(app.currentVersionId)`

---

### 3.2 P1 — 市场 / 分享 / 会话 / 设置（13 页）

#### 3.2.1 `/marketplace` — 市场首页
**现状**：已有，12 张卡片 grid。
**改造**：分类 tabs（All / Official / Community）、搜索、sort by stars/new。

#### 3.2.2 `/marketplace/:id` — 市场条目详情
展示：截图、功能描述、需求的 capability、作者、版本日志、评价、fork/subscribe 按钮。

#### 3.2.3 `/marketplace/publish` — 发布我的 App 到市场
多步表单：选 App → 填描述 → 选截图 → 确认 capability 公开 → 提交。

#### 3.2.4 `/shared` — 他人分享给我的 App
列表，区分 subscribed vs forked。

#### 3.2.5 `/shared/:id` — 分享的 App 详情
类似 `/apps/:id` 但多数 tab 只读；可选 "Fork to mine"。

#### 3.2.6 `/sessions` — 所有历史会话
全部 session 列表，筛选 status、搜索 prompt。

#### 3.2.7 `/sessions/:id` — 等价于 `/generate/:sessionId`（别名 route）

#### 3.2.8 `/settings` — 个人设置首页（概览）

#### 3.2.9 `/settings/profile` — 基本资料

#### 3.2.10 `/settings/tokens` — API Token 管理
CLI 用的 token 创建 / 撤销 / 查看上次使用时间。

#### 3.2.11 `/settings/notifications` — 通知渠道
绑定飞书 / Webhook；选哪些事件通知。

#### 3.2.12 `/settings/capabilities` — 我可用的权限清单
展示当前用户能使用的全部 capability（只读）；按 category 分组；
灰显 denied 的并给原因。

#### 3.2.13 `/settings/audit` — 我触发的审计事件

---

### 3.3 P2 — 认证 / 团队 / 管理 / 错误（13 页）

#### 3.3.1 `/login` — 登录（SSO + 账密两种）
#### 3.3.2 `/onboarding` — 新用户引导（3 步）
#### 3.3.3 `/404` · `/403` · `/500` · `/maintenance` — 错误页
#### 3.3.4 `/team` — 团队首页
#### 3.3.5 `/team/members` — 成员管理（team-manager 可编辑）
#### 3.3.6 `/team/policies` — 策略规则
#### 3.3.7 `/team/audit` — 团队审计流
#### 3.3.8 `/team/roles` — 角色权限矩阵
#### 3.3.9 `/admin/apps` — 租户内所有 app（admin 视图）
#### 3.3.10 `/admin/capabilities` — capability 注册表
#### 3.3.11 `/admin/integrations` — 集成源管理（CRUD）
#### 3.3.12 `/admin/audit` — 租户级审计（跨团队）
#### 3.3.13 `/admin/users` — 用户管理（admin 可邀请/禁用）

**删除**：`/admin/models`（Q8 决策：LLM 选择不暴露）。

### 3.4 P3 — 延后（现在不做）

- `/team/budgets` — Budget 实体延后，UI 暂不实现

---

## 4. 路由表

| Path | Tab | Priority | Component |
|---|---|---|---|
| `/` | — | P0 | HomePage |
| `/generate` | — | P0 | GeneratePage |
| `/generate/:sessionId` | — | P0 | GeneratePage (replay mode) |
| `/apps` | — | P0 | AppsListPage |
| `/apps/:id` | overview | P0 | AppDetailPage |
| `/apps/:id` | preview | P0 | AppDetailPage (viewKind renderer) |
| `/apps/:id` | code | P0 | AppDetailPage |
| `/apps/:id` | manifest | P0 | AppDetailPage |
| `/apps/:id` | executions | P0 | AppDetailPage |
| `/apps/:id` | versions | P0 | AppDetailPage |
| `/apps/:id` | logs | P0 | AppDetailPage |
| `/apps/:id` | audit | P0 | AppDetailPage |
| `/apps/:id` | settings | P0 | AppDetailPage |
| `/apps/:id/executions/:eid` | — | P0 | ExecutionDetailPage |
| `/apps/:id/versions/:vid` | — | P0 | VersionDetailPage |
| `/marketplace` | — | P1 | MarketplacePage |
| `/marketplace/:id` | — | P1 | MarketplaceDetailPage |
| `/marketplace/publish` | — | P1 | MarketplacePublishPage |
| `/shared` | — | P1 | SharedListPage |
| `/shared/:id` | — | P1 | SharedDetailPage |
| `/sessions` | — | P1 | SessionsListPage |
| `/sessions/:id` | — | P1 | GeneratePage (replay alias) |
| `/settings` | — | P1 | SettingsLayout |
| `/settings/profile` | — | P1 | SettingsProfilePage |
| `/settings/tokens` | — | P1 | SettingsTokensPage |
| `/settings/notifications` | — | P1 | SettingsNotificationsPage |
| `/settings/capabilities` | — | P1 | SettingsCapabilitiesPage |
| `/settings/audit` | — | P1 | SettingsAuditPage |
| `/login` | — | P2 | LoginPage |
| `/onboarding` | — | P2 | OnboardingPage |
| `/404` | — | P2 | NotFoundPage |
| `/403` | — | P2 | ForbiddenPage |
| `/500` | — | P2 | ServerErrorPage |
| `/maintenance` | — | P2 | MaintenancePage |
| `/team` | — | P2 | TeamLayout |
| `/team/members` | — | P2 | TeamMembersPage |
| `/team/policies` | — | P2 | TeamPoliciesPage |
| `/team/audit` | — | P2 | TeamAuditPage |
| `/team/roles` | — | P2 | TeamRolesPage |
| `/admin/apps` | — | P2 | AdminAppsPage |
| `/admin/capabilities` | — | P2 | AdminCapabilitiesPage |
| `/admin/integrations` | — | P2 | AdminIntegrationsPage |
| `/admin/audit` | — | P2 | AdminAuditPage |
| `/admin/users` | — | P2 | AdminUsersPage |
| `/team/budgets` | — | P3 | (deferred) |

---

## 5. Sprint 规划

Sprint = 一个可交付的段落，不等于固定时长。目标清晰比日期重要。

### Sprint 0 — 基建（Foundation）
**产出**：mock 数据层可用（store + async fns + hooks），现有 4 个页面不直连数组。
- 建 `src/mock/store.ts`（Map-based）+ `src/mock/delay.ts`
- 扩展 `src/types.ts`：补齐 P0 实体完整字段（Tenant / User / App + viewKind /
  Session / Capability；其他 P0 实体 Sprint 2/3 再加）
- 重构 `mock/apps.ts` / `mock/sessions.ts` / `mock/satellites.ts` 为 async fns
- 新建 `src/hooks/`: `useApps`, `useApp`, `useSessions`, `useSession`,
  `useSatellites`, `useCurrentUser`, `useCurrentTenant`
- 迁移 `HomePage` / `Sidebar` / `MarketplacePage` / `AppDetailPage` 消费 hooks
- **暂时保留 `App.embedUrl` 字段** + `EmbedView` 分支（Sprint 3.5 删）
- Seed：Tenant ×1, User ×3, App ×20+ (viewKind 分布), Session ×15+,
  Satellites ×8 (现有), Capabilities ×40+（英文 displayName）
- **Acceptance**：`pnpm build` 绿，所有现有页面行为不回归，
  无 `APPS.filter()` 残留；mock 返回全走 Promise

### Sprint 1 — Home / Apps List 深化
- 实现 `/apps`（独立列表页）
- HomePage 集成 `useSessions({ recent })`
- Sidebar 接 `useApps`
- Error injection 链路打通（`?mockError=apps.list`）
- Loading / empty / error 组件建立（可复用）
- **新增 `<RelativeTime>` 组件**（Q14 决策：全局相对时间，hover tooltip 绝对）
- **Acceptance**：/apps 支持排序、筛选、搜索；error injection 场景下
  所有页面优雅降级

### Sprint 2 — App Detail Tab 系列（P0 核心）
- 新增实体：AppVersion, Execution, ExecutionLog
- `/apps/:id?tab=overview` 接真实数据
- `/apps/:id?tab=preview`（骨架；dashboard renderer 是空 shell，
  其他 renderer 给 placeholder）
- `/apps/:id?tab=code` · `?tab=manifest`
- `/apps/:id?tab=executions` + `/apps/:id/executions/:eid`
- `/apps/:id?tab=versions` + `/apps/:id/versions/:vid` + rollback 交互
- `/apps/:id?tab=logs`（含 live 日志模拟）
- `/apps/:id?tab=settings`（update / delete）
- **Acceptance**：从 /apps 点进详情 → 所有 tab 切换正常 → 可回滚版本 →
  可删除 → 列表消失

### Sprint 3 — Generate / Session 深化
- 新增实体：Session 完整 stages、SessionStage artifact
- `/generate` 改为真实消费 `useCreateSession`
- `/generate/:sessionId` 实现回放
- `/sessions`（P1 提前做，和 generate 一起闭环）
- Scope stage 的 "Confirm & proceed" 人工确认 UI（Q4 决策）
- AuditEvent 引入（deploy/rollback/delete 事件写入）
- `/apps/:id?tab=audit`
- **Acceptance**：新 prompt 走完 7 stage → 生成 App → 审计能看到 deploy 事件

### Sprint 3.5 — Cockpit Rewrite（v0.2 新增）
**目标**：把 `public/embedded/cockpit.html`（1870 行）重写为
`viewKind='dashboard'` 的 React 原生实现，彻底消灭 `embedUrl` 机制。
- 建 `src/components/renderers/DashboardRenderer/`
- cockpit 相关 mock 数据（客户健康度、风险预警、SLA、分成结算）
  作为 `Execution.outputSummary` 或独立 mock
- 从 `src/types.ts` 删 `App.embedUrl`
- 从 `AppDetailPage` 删 `EmbedView` 分支
- 删 `public/embedded/cockpit.html` 和 `public/embedded/` 目录
- vite.config.ts 如无其他 embed 入口保持不变
- Seed 里 `biz-cockpit` app 改为 `viewKind='dashboard'`，
  并关联一个已完成的 Session（`resultAppId='biz-cockpit'`）
- **Acceptance**：/apps/biz-cockpit?tab=preview 渲染完整 dashboard；
  grep 整个 repo 无 `embedUrl` 字段残留

### Sprint 4 — Marketplace / Shared（P1 宽度 1/2）
- 新增实体：MarketplaceListing（补全）、Share
- `/marketplace` 增强（筛选/排序/搜索）
- `/marketplace/:id`
- `/marketplace/publish`
- `/shared` + `/shared/:id` + Fork to mine（包含 `forkedFromVersionId`）

### Sprint 5 — Settings（P1 宽度 2/2）
- 新增实体：ApiToken, Notification, DeliveryChannel（kind: feishu/webhook）
- `/settings/*` 全系列

### Sprint 6 — Auth + Error Pages（P2 起步）
- `/login` / `/onboarding`
- `/404` / `/403` / `/500` / `/maintenance`
- 未匹配路由自动跳 `/404`

### Sprint 7 — Team
- 新增实体：Team, Policy
- `/team/*` 全系列（不含 `/team/budgets`）

### Sprint 8 — Admin
- 新增实体：Integration（补全）
- `/admin/*` 全系列（不含 `/admin/models`）
- Admin 级别的 user 管理和 integration CRUD

---

## 6. Mock Seed 清单

每个 entity 在对应 Sprint 的 Acceptance 里都必须满足以下 seed 要求。

| Entity | Count | 关键边界覆盖 |
|---|---|---|
| Tenant | 1 | `acme` / kind=`dce` / active |
| User | ≥3 | 自己 / 同团队同事 / 跨团队同租户 |
| App | ≥20 | 三 group；viewKind 五种都有；long name；空 description；failed 态；英文 name |
| AppVersion | ≥60 | 每 mine App 平均 3 版本；含 rollback 链路；英文 changeNote |
| Session | ≥15 | 成功 ×8（其中 1 个 `resultAppId='biz-cockpit'`）、warning ×2、policy denied ×1、sandbox failed ×2、cancelled ×1、draft ×1 |
| Execution | ≥90 | 前 3 mine App 各 30+；含 failed/timeout/running |
| ExecutionLog | ≥500 | 每 execution 5–20 条 log |
| Capability | ≥40 | 5 category（dce/crm/hr/feishu/github）；英文 displayName |
| Share (P1) | ≥8 | subscribed ×5 + forked ×3（至少 1 个含 `forkedFromVersionId`） |
| MarketplaceListing (P1) | ≥12 | star 范围 10–15k |
| AuditEvent (P1) | ≥50 | 覆盖 deploy/rollback/update/delete/share |
| ApiToken (P1) | ≥3 | 含已过期、含 lastUsed 为 null |
| Integration (P2) | ≥5 | dce/github/feishu + webhook 通用 + 1 placeholder |

**原则**：
- Seed 文件按 entity 分（`src/mock/seed/apps.ts` 等）
- 用具名 helper 生成，不手工写死 ID（`mkApp({ id: 'biz-cockpit', ... })`）
- 时间戳生成用相对工具（`daysAgo(3)`），不写死字面值
- 所有 id 为 kebab-case，避免 UUID（开发期可读性）
- **所有 App name / description / capability displayName 使用英文**；
  Session prompt 允许中英混排（贴近真实输入）

---

## 7. Decided (原 Open Questions)

所有 14 条已在 v0.2 决策。以下为决策结论摘要：

| # | 决策 | 生效位置 |
|---|---|---|
| 1 | Team 内共享算 `group='shared'` | §2.2.3 App.group 语义 |
| 2 | Fork = git 风格，不推送；加 `forkedFromVersionId` 供未来 sync | §2.2.3; 3.1.11 |
| 3 | `embedUrl` 在 Sprint 3.5 彻底重写，cockpit 变普通 app | §5 Sprint 3.5; §2.2.3 |
| 4 | Capabilities AI 推断 + 用户 Confirm & proceed | §3.1.2; §2.2.5 |
| 5 | Role = `user / team-manager / admin` | §2.2.2 |
| 6 | 多租户完全隔离；`tenantId` 进所有业务实体；mock 只 1 tenant | §1.2; §2.2.1; §2.4 |
| 7 | Delivery = 飞书 + webhook；webhook 是通用出口 | §2.3 DeliveryChannel; §3.2.11 |
| 8 | LLM 模型不暴露给用户；删 `/admin/models` | §3.3 |
| 9 | Integration 走 admin 机制，`/admin/integrations` CRUD | §3.3.11 |
| 10 | Budget 延后到 P3，现在不做 | §2.1; §2.3; §3.4 |
| 11 | `dataRetention` 可选字段，默认不展示 | §2.2.4 AppManifest |
| 12 | Audit 保留 180d，不导出 | §3.1.13 |
| 13 | UI 和 seed 数据使用英文；prompt 允许中英混排 | §1.3 Rule 6; §6 |
| 14 | 统一相对时间 `<RelativeTime>`，hover 出绝对时间 | §5 Sprint 1 |

**新出现的疑问**（v0.2 之后再遇到时补入）：

（暂无）

---

## 8. 建设进度追踪

每个 Sprint 完成后在此更新。Sprint 未开始 = `-`，进行中 = `WIP`，完成 = ✓ + 日期。

| Sprint | Status | Completed |
|---|---|---|
| 0 — Foundation | ✓ | 2026-04-22 (`fcd1771`) |
| 1 — Home / Apps List | ✓ | 2026-04-22 (`cf14f31`) |
| 2 — App Detail Tabs | ✓ | 2026-04-22 (`2ac9ed6`) |
| 3 — Generate / Session | ✓ | 2026-04-22 (`121dbe2`) |
| 3.5 — Cockpit Rewrite | ✓ | 2026-04-22 (`5bda556`) |
| 4 — Marketplace / Shared | ✓ | 2026-04-22 (`4b371a1`) |
| 5 — Settings | - | |
| 6 — Auth + Error | - | |
| 7 — Team | - | |
| 8 — Admin | - | |

---

## 9. 变更日志

- **2026-04-22** · v0.2 · 吸收 §7 的 14 条决策。主要变更：
  - 引入 `Tenant` 实体与多租户模型；`tenantId` 进所有业务实体
  - 删除 `HostSystem` 实体（并入 `Tenant.hostSystemKind`）
  - Role 由实体降级为 union type `'user' | 'team-manager' | 'admin'`
  - App 新增 `viewKind` 字段（dashboard / notifier / report / form / bot）
  - App 新增 `forkedFromVersionId`（git-style fork）
  - App 删除 `embedUrl`（Sprint 3.5 完成重写）
  - 新增 Sprint 3.5 "Cockpit Rewrite as Dashboard viewKind"
  - 新增 `/apps/:id?tab=preview`（按 viewKind 分发渲染器）
  - 删除 `/admin/models`（LLM 不暴露）
  - `DeliveryChannel` 简化为 `feishu / webhook`
  - Budget 延后到 P3（`/team/budgets` 标 deferred）
  - 新增 `<RelativeTime>` 约定
  - UI / Seed 数据全英文；prompt 允许中英混排

- **2026-04-22** · v0.1 · 初版。基于 `ai_app_talk.txt` 产品思考 + 现有
  4 个页面 + `CLAUDE.md` 架构约束。
