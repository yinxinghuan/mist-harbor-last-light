# Wilson Prolog RPG 框架服务器基线报告

日期：2026-09-04
范围：只验证同事提供的原始 Prolog 框架、服务器上已有部署，以及《雾港最后一盏灯》的最小兼容扩展。本文不把本地 TypeScript 规则替代品算作原框架验证。

## 1. 结论

原框架已经在同事提供的服务器账号中真实运行，Zork 样例与《雾港》房间/物品路线均由服务器上的 SWI-Prolog 执行，不是前端模拟。

原框架可直接承担：

- session 创建与加入；
- 房间、出口和移动；
- 物品、容器、拿取和丢弃；
- 静态 NPC 的近距离对话写入；
- 内存中的每 session 位置和 flag 状态。

原框架不能直接完成《雾港》完整章节，因为没有暴露游戏自定义动作入口，也没有信任/信号数值、组合前置条件、原子材料消耗、完成状态和持久化。为忠实保留其结构，本次没有替换 `dynamic_server.pl` 或 `util.pl`，而是在其外侧增加：

- loopback 启动器；
- 通用 `/game/action`、`/game/state` 与 Story Session 兼容 `/v1/resolve`；
- 原框架已经预留的游戏目录内 `actions.pl`；
- 每 session 全动作锁；
- 从 Story Session 权威快照重建 Prolog session 的适配层。

这套扩展已在真实服务器上跑通完整《雾港》规则链，但目前仍是 SSH 隧道下的实验环境，不是线上发布服务。

## 2. 服务器与原始文件

- 账号：`prolog`
- 用户目录：`/home/prolog`
- 原框架目录：`/home/prolog/game_logic1`
- 实验扩展目录：`/home/prolog/alteru-prolog-experiment`
- 系统：Ubuntu x86_64
- SWI-Prolog：10.1.13，程序位于 `/usr/local/bin/swipl`
- 用户级 systemd：不可用
- 可用磁盘：测试时约 9.4 GB

服务器原框架与同事提供压缩包的校验：

| 文件 | 压缩包 SHA-256 | 服务器 SHA-256 | 结论 |
|---|---|---|---|
| `SKILL.md` | `e770db16bc8e9040facd980d0c7b64b4763a69f8ab46e75527ae11919f1a70a8` | 相同 | 完全一致 |
| `dynamic_server.pl` | `3b98e22367f3c2639df22a6641cc46b1a356d71010953c90dc34361f362bd627` | 相同 | 完全一致 |
| `util.pl` | `28eb349a81fd2c417b66157a8176d9cd14ed6d2df7ba589b5098c19b6ec5147a` | 相同 | 完全一致 |
| `start_server.sh` | `bccb9376d487afc0f3624e95b88b24203178f3e604435fe1a5956edbbbe59e7a` | `449491ce0720795e4e885024dbfd8fc4a7f7bdd49634c7b7d8a0098b0343a03c` | 同事已把目录改为 `/home/prolog/game_logic1`，端口改为 `8000` |

## 3. 受控启动方式

原 `start_server/1` 默认监听所有网卡，同时开放无认证 `/consult`。本次没有把它作为常驻公网服务启动。

实验启动器 `loopback_launcher.pl` 只把监听地址改为：

```text
127.0.0.1:8000
```

测试流量通过本机 SSH 隧道访问：

```text
本机 127.0.0.1:18000
  → SSH
  → 服务器 127.0.0.1:8000
```

原服务源码和路由逻辑保持不变。测试结束后停止并检查精确进程，不留下公开 listener。

## 4. 原框架真实测试

### Zork 样例

服务器实际完成：

1. 创建 `zork1` session；
2. 查询 `west_of_house` 出口；
3. 查询玩家所在房间；
4. 打开 mailbox；
5. 拿取 advertisement；
6. 查询玩家 inventory；
7. 向北移动；
8. 查询 active sessions。

### 《雾港》基础数据

《雾港》数据放在：

```text
/home/prolog/game_logic1/games/mist_harbor_last_light
```

原始路由真实完成：

1. 从信号站开始；
2. 阅读黄铜控制台；
3. 打开继电器盒并取得钥匙；
4. 取得风暴提灯；
5. 进入继电器室并取得绝缘铜线；
6. 返回信号站并前往下码头；
7. 向安雅发言并读取 dialogue log；
8. 取得菲涅尔镜片；
9. 登上聚光室；
10. 阅读维修卡；
11. 查询最终 inventory。

### 多 actor 与 session 隔离

- 同一 session 中，actor A 与 actor B 的位置独立；
- 同一 session 中，物品和容器状态共享；
- 不同 session 的物品状态隔离；
- 进程重启后 `/sessions` 为空，旧 session 无法继续，证明原状态只在内存。

## 5. 原框架发现的问题

### P0：`/consult` 无认证且可执行提交内容

`/consult` 会对提交文本调用 Prolog `load_files/2`，其中 directive 可以执行。即使普通 `room/5` 探针返回“加载成功”后并未出现在目标模块，这个入口仍不能暴露给不受信任用户或公网。

### P0：动作并发不是原子的

原 `take_item/4` 在 mutex 外检查物品位置，只把最终 `retract/assert` 放进 mutex。两个请求可以同时通过前置检查。

真实并发结果：

```json
{"runs":30,"double_success":19,"single_success":11,"unexpected":0}
```

即 30 轮中有 19 轮，同一把钥匙被两名 actor 同时返回“success”。

### P0：进程重启丢失全部 session 状态

`session_info/3`、`session_loc/3`、`session_flag/3` 和 `dialogue_log/7` 都是内存动态事实，没有持久化。

### P1：静态 NPC 不会出现在 `/actor/others`

`list_actors_in_room/3` 只枚举 `session_loc/3`，不会枚举游戏模块的静态 `actor/8`。因此林芮、安雅不出现在列表中；但 `/speak` 使用另一套 `get_actor_location/3`，又能正常向静态 NPC 发言。

### P1：`open` / `close` 文案变量未绑定

`open_item/4` 与 `close_item/4` 使用未赋值的 `ItemName`，真实响应类似：

```text
You opened _4168.
```

### P1：拿起后无法阅读物品

`read_item/4` 只从当前房间树向下搜索，不搜索 actor inventory。广告拿起后再读会返回“不在这里”。

### P1：缺失 session 经常变成 500

若底层 goal 失败，部分 handler 没有稳定的结构化 404/409，而是由 HTTP 层返回 500。

### P1：工作目录是隐式依赖

游戏数据使用 `games/<id>/...` 相对路径；不从 `/home/prolog/game_logic1` 启动时，会找不到全部游戏文件。

### P2：Zork 条件出口数据错误

Zork 的 `flags.pl` 直接声明 `global_flag(won_flag).`，导致 Stone Barrow 条件出口从开局即出现。这是游戏数据转换问题，不是《雾港》扩展造成。

### P2：session 清理不清 dialogue

`clear_session/1` 会清 `session_info`、`session_loc`、`session_flag`，但不会清 `dialogue_log`。重复使用相同 session ID 时可能保留旧对话。

## 6. 最小兼容扩展

### 通用边界

`alteru_extension.pl` 新增：

- `GET /health`
- `GET /game/state`
- `POST /game/action`
- `POST /v1/resolve`

`/game/action` 与 `/game/state` 用于直接验证 Wilson 的 stateful session 模型。`/v1/resolve` 是 Story Session 的适配边界：

1. 接收稳定 `game_id/session_id/actor_id/action_id`；
2. 接收由服务端 Story Session 裁剪的地点、三项数值、已声明 facts、物品和角色状态；
3. 清空并重建对应 Prolog session；
4. 在同一个 session mutex 内执行完整的前置检查和全部写入；
5. 返回接受/拒绝与固定 effect manifest；
6. Worker 将 effect manifest 与本地 Cartridge 清单逐项比较；任何偏差均为 `RULE_SERVICE_MISMATCH`，Story Session 不写入。

浏览器不会直接向 Prolog 发送这个状态；生产链路中调用者是 Story Session Worker。

### 《雾港》规则

游戏 `actions.pl` 新增的确定性动作：

- 拿取风暴提灯；
- 检查主控继电器；
- 获得林芮信任与钥匙；
- 持钥匙和有灯油时进入继电器室；
- 取得铜线；
- 返回信号站；
- 满足故障与钥匙条件后前往下码头；
- 安雅可见登场后取回镜片；
- 两件零件齐全后进入聚光室；
- 信任足够时原子消耗铜线/镜片并完成主灯修复；
- 三个镇定恢复动作。

## 7. 扩展实测结果

完整服务器规则链：

- 初始缺钥匙/提灯动作被拒绝且零状态变化；
- 信任 `1 → 2 → 3`；
- 信号 `1 → 2 → 3 → 6`；
- 灯油使用 `0 → 1`；
- 安雅只有在下码头可见介绍后才进入 facts/同行状态；
- 铜线和镜片修复时从 inventory 同时移除；
- 完成状态变为 `true`；
- 重复修复被拒绝。

扩展并发测试：

```json
{"runs":50,"double_success":0,"single_success":50,"unexpected":0}
```

Story Session → 真实 SWI-Prolog 端到端测试：

```json
{
  "ok": true,
  "signal": 6,
  "trust": 3,
  "completed": true,
  "checks": [
    "real-swi-prolog-decision",
    "story-session-state-hydration",
    "precondition-rejection",
    "ten-action-campaign",
    "atomic-item-consumption",
    "checkpoint-completion"
  ]
}
```

因为 `/v1/resolve` 每回合都会从 Story Session 快照重建 Prolog session，这条测试也覆盖了“Prolog 内存完全丢失后仍可继续”的恢复模型。

## 8. 当前不能宣称的事项

2026-09-04 已新增并实测生产收口：

- `production_launcher.pl` 启动前强制要求 `RULE_SERVICE_TOKEN`；
- `/v1/resolve` 无令牌返回 403，有正确令牌才能执行；
- 请求体上限 64 KiB；
- 原始 `/consult`、加载、session、移动、物品、对话和实验 `/game/*` 路由在生产 listener 上均为 404；
- 服务只监听服务器 `127.0.0.1:8000`，通过 SSH 隧道再次跑通完整章节。

目前仍不能宣称：

- 服务已经由 supervisor/容器托管并能在服务器重启后自动恢复；
- 服务已发布到公网或生产私网；
- Cloudflare Worker 已能访问该服务器；
- 两个真实 AlterU 账号完成线上闭环；
- 游戏已经上线。

## 9. 下一步所需支持

要把实验升级成可发布链路，需要同事提供或确认：

1. 把现有 `https://uu545921-zfkm-aec62664.westb.seetacloud.com:8443` 代理到服务器 loopback `127.0.0.1:8000`，或提供另一条 Worker 可访问的受保护 HTTPS 网关；当前该地址的 `/health` 仍是云平台 404；
2. 进程托管方式（supervisor 或容器；当前账号没有 user systemd），并保持只监听 loopback/私网；
3. 外部只转发 `/health` 和 `/v1/resolve`，禁止暴露原始 `/consult`；
4. 明确 HTTPS 超时、日志和重启策略；
5. 把同一私有 token 注入 Worker secret，并保留 `RULE_SERVICE_URL`、`RULE_SERVICE_REQUIRED=true`。

AlterU 服务端签名身份仍是面向普通用户开放制作平台之前的安全门禁，但不阻塞当前受控实验继续。
