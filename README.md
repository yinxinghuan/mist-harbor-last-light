# The Last Light of Mist Harbor / 雾港最后一盏灯

一款使用 AlterU Story Session 与服务器端 Prolog 规则判定的连续文字 RPG。玩家在暴风夜接管旧港信号站，通过调查、交涉、物品组合和设备修复，为失联渡船恢复最后一条归航信号。

## 本地运行

```bash
npm ci
npm run dev
```

前端与 Story Session Worker 可以在本地独立构建。受 Prolog 管理的确定性动作在正式模式下要求私有规则服务；浏览器不直接连接 Prolog，也不持有服务凭据。

```bash
npm run build
npm run check:story-session
```

## 架构边界

- 浏览器负责阅读、输入、即时反馈与待提交 journal。
- Story Session Worker + Durable Object SQLite 负责会话、版本、幂等、恢复和用户隔离。
- 服务器端 SWI-Prolog 负责关键动作的条件判断与效果清单。
- `game-chat` 只负责不改变权威规则的自由叙事。

`server-baseline/` 保存本游戏对 Wilson 原始 stateful Prolog 框架的兼容扩展、生产路由收口和验证脚本；原始框架本身由平台服务器单独提供，不随公开游戏仓库分发。生产环境只允许 `/health` 与带服务凭据的 `/v1/resolve`，不得开放 `/consult`。

详细设计见 [`doc/requirements.md`](doc/requirements.md)、[`doc/visual.md`](doc/visual.md) 与 [`doc/technical.md`](doc/technical.md)。
