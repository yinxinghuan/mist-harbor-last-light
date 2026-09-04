# 《雾港最后一盏灯》技术文档

## 1. 技术栈

- 前端：React 18、TypeScript、Less、Vite，发布基址固定为 `./`。
- 游戏引擎：AlterU stateful story schema 10；Cartridge 定义世界、人物、地点、物品、三项数值、确定性动作与双语文本。
- 会话权威：同 UUID Story Session Worker + Durable Object SQLite，负责会话、快照、版本、事件、幂等、恢复与 owner 目录。
- 确定性规则：Wilson 原始 stateful SWI-Prolog 框架及本游戏 `actions.pl`。Worker 将裁剪后的 Story Session 权威快照注入对应 Prolog session，再执行一条白名单动作。
- 自由叙事：Aigram `game-chat` 只处理未被确定性动作接管的叙事；它不能直接修改权威状态。

## 2. 目录结构

```text
src/story/
  cartridges/mistHarborLastLight.ts  # 世界、动作和安全效果清单
  engine/prologRuleClient.ts         # 状态投影、服务调用和效果逐项校验
  engine/executeTurn.ts              # 无 DOM 的服务端回合流水线
  session/                            # 浏览器 journal、恢复和 Story Session 客户端
  StoryShell.tsx                      # 游戏入口、累积阅读、HUD 和抽屉
worker/
  source.ts                           # Worker API 入口和规则服务强制配置
  storySessionRuntime.ts              # Durable Object SQLite 权威存储
  bindings.json                       # DO、公开规则服务 URL 和 required 标志；不含 token
server-baseline/
  alteru_extension.pl                 # Wilson 框架的 Story Session 兼容层
  production_launcher.pl              # 仅保留 /health 与 /v1/resolve 的生产入口
  supervisord.conf                     # 普通账号可用的进程守护与日志轮转
  games/mist_harbor_last_light/       # 本游戏 Prolog 房间、物品、角色与动作
  *_test*.sh                          # 原框架、完整路线、并发和生产路由测试
_qa/                                  # 协议、恢复、身份、浏览器和视觉验证
doc/                                  # 需求、视觉、技术、服务器与平台路线文档
```

公开仓库不包含 Wilson 原始 `dynamic_server.pl`、`util.pl` 或服务器凭据；这些由平台规则服务器单独提供。游戏仓库只保留本游戏数据与兼容扩展。

## 3. 核心模块

### Story Session 状态与恢复

浏览器先持久化待确认 action envelope，再提交稳定 `action_id`、`expected_version` 与 `ruleset_version`。Durable Object 在一次 SQLite 事务中提交快照、事件和响应缓存；同一动作重放返回相同响应，竞争同一版本的不同动作只有一个能写入。响应未知时，浏览器按旧 cursor 读取事件并认领已提交结果，不创建第二个本地 writer。

AlterU 内部实验当前按实时宿主用户 ID 派生 owner；平台外访客使用随机 capability。Worker 在进入 Durable Object 前只保留哈希 owner。这个方案已完成功能隔离，但未经服务端签名的用户 ID 仍可伪造，不能作为开放创作平台的最终认证。

### Wilson Prolog 规则边界

`prologRuleClient.ts` 只发送稳定的 `game/session/actor/action/request` ID，以及地点、三项数值、规则声明过的 facts、物品 `id/count` 和已知角色状态。正文、提示词、头像、用户名、capability 与完整存档不会发送给 Prolog。

`alteru_extension.pl` 每回合在 session mutex 内清理并从 Story Session 快照重建原框架的 `session_info/session_loc/session_flag`，随后调用游戏模块 `game_action/4`。这样 Prolog 进程重启不会丢失已经由 Story Session 提交的玩家进度。

服务返回的 accepted/rejected 和效果清单必须与 Cartridge 的本地安全清单逐项一致；任何额外效果、缺失效果、错动作或错版本都会产生 `RULE_SERVICE_MISMATCH`，Story Session 零写入。

生产 launcher 会删除原始 `/consult`、`/load_game`、session、移动、物品和调试路由，只保留公开健康检查和带服务令牌的 `/v1/resolve`。请求体上限为 64 KiB。令牌只存在于服务器私有环境和 Worker secret，不进入浏览器、Git、ZIP 或 Skill。

### API 与部署

前端只访问同 UUID `/<GAME_ID>/api/story/*`。Remix 替换 `src/game-id.ts` 中的 UUID 后，会获得独立 Worker 与 Durable Object namespace；Pages 只是同 commit 的静态镜像，不承载 Story Session。

Worker 配置：

- `RULE_SERVICE_URL`：Worker 可访问的 HTTPS 规则网关；
- `RULE_SERVICE_TOKEN`：至少 32 字节的服务间 secret；
- `RULE_SERVICE_REQUIRED=true`：正式实验 fail closed，配置或服务不可用时不推进确定性动作。

截至 2026-09-05，正式链路已经完成：Prolog 只监听服务器 `127.0.0.1:6008`，由 AutoDL 当前实例的 HTTPS 自定义服务地址转发到公网 `8443`；用户态 supervisord 守护并自动重启服务；Worker 以加密 secret 注入令牌，`RULE_SERVICE_REQUIRED=true`。线上 canary 已完成一次前置条件拒绝和十动作通关，同时覆盖 enrollment/action 幂等、旧版本冲突、Durable Object 重读、目录和跨 owner 隔离。

正式主站是 `https://game.aiwaves.tech/8a51d15e-7c00-4e27-bc63-25624ee75ac1/`。GitHub Pages 是同 bundle 的静态镜像，不承载可写 Story Session；正式 RPG 验收只以 UUID 主站为准。

## 4. 扩展点

- 改剧情、人物、地点、规则或数值：编辑 `src/story/cartridges/mistHarborLastLight.ts`，同步 `server-baseline/games/mist_harbor_last_light/actions.pl`，并运行效果一致性与完整路线测试。
- 改 Story Session 协议：编辑 `src/story/session/` 与 `worker/storySessionRuntime.ts`，保留版本、幂等、owner 隔离、未知响应恢复与 legacy rollback 合同。
- 改 Prolog 适配：编辑 `server-baseline/alteru_extension.pl`；不得恢复公网 `/consult`、动态文件路径、浏览器直连或把 Prolog 内存当持久化真源。
- 改素材与视觉：编辑 `src/story/story.less`、Cartridge 图片方向和 `src/story/img/worlds/`，再对相同状态做 390×844 与 320×568 视觉复验。
- 升级身份：把前端用户 ID 换成 AlterU 服务端签发、带 audience/game/user/expiry/nonce 的短时声明；Story Session 数据结构无需重写，只替换 owner 来源。
- 扩展为用户创作平台：只接收受限 Cartridge/DSL，经 schema、可达性、数值、引用、规则、故障和视觉检查后编译并签名；用户永远不接触 SSH、服务令牌或任意 Prolog 源码入口。
