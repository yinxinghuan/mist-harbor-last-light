# 从第一款实验游戏到 AlterU 安全 RPG 生产平台

## 已证明的第一层

《雾港最后一盏灯》已经把四类责任拆开：

1. 浏览器负责输入、阅读和即时提交反馈；
2. Story Session 负责用户隔离、状态、版本、幂等、恢复和事件记录；
3. Wilson 原始 stateful Prolog 框架只负责白名单动作的规则判定；
4. 模型只负责不改变权威规则的自由叙事。

当前游戏还完成了 AlterU 用户系统的功能接入：实时读取宿主用户资料，按用户稳定绑定 Story Session，本地回退缓存按用户分区；匿名外部访客使用独立 capability。这个过渡方案可做产品实验，但前端用户 ID 尚未签名，不能作为开放平台的最终安全边界。

真实服务器上的 SWI-Prolog 已经通过完整规则链与并发测试：原框架拿取动作 30 轮出现 19 次双成功，兼容层把整个动作放进 session mutex 后 50 轮为 0 次；Story Session 通过 SSH 隧道完成 10 个动作并在材料原子消耗后结束章节。每回合由 Story Session 快照重建 Prolog session，因此规则服务重启不会丢失已经提交的玩家进度。

## 第二层：让其他用户制作，而不是登录服务器

用户不接触 SSH、服务器密码、Prolog 文件路径、进程管理或 `/consult`。制作入口只接受一个受限 RPG Cartridge/DSL：人物、地点、数值、物品、动作条件、效果、文本和素材方向。

后台生产流水线：

```text
用户提交 DSL
  → schema / 数值上限 / 引用完整性检查
  → 角色首次登场、路线可达性、原子消耗和恢复检查
  → 编译前端 Cartridge + Prolog 静态规则
  → 领域测试、故障注入、视觉 QA
  → 生成带 hash 和签名的 ruleset artifact
  → 发布独立 game UUID、Worker 绑定和规则版本
```

用户输入永远不能成为 Prolog 源码、模块名、文件路径、shell 参数或任意 HTTP 路由。

## 第三层：安全生产平台

- 身份：AlterU 签发短时服务端可验签证明，绑定 `user/game/audience/expiry`；替换可伪造的 `alteru-user-id-v1-experimental`，并把 `anonymous-capability-v1` 限定为平台外访客用途。
- 控制面：创建游戏、编译、测试、审核、发布、回滚和规则版本登记。
- 数据面：每款游戏的 Story Session 权威存储；共享规则执行池只读加载已签名规则 artifact。
- 秘密：规则服务 token、部署密钥和数据库凭据由 secret manager 注入，永不进入浏览器、ZIP、skill 或 Git。
- 隔离：每个规则集独立 namespace、资源上限、超时、请求体上限和网络 allowlist；禁止动态 consult。
- 可观测性：按 game/ruleset/request_id 记录判定延迟、拒绝、超时和版本不一致；日志不存正文、头像或 capability。
- 配额：用户构建次数、规则复杂度、运行时 CPU、模型调用和媒体生成分别限额。
- 发布：规则 artifact hash 与前端 commit、Worker 版本一起锁定；不允许前端和规则集漂移。

## 进入正式线上实验仍需要的支持

1. SSH 公钥、原始框架和 SWI-Prolog 已经可用，不再是阻塞项；
2. 服务器 loopback 上的安全生产入口已完成：只保留 `/health` 与带 token 的 `/v1/resolve`；
3. 现有 `https://…:8443` 仍返回云平台 404，需要把它代理到 loopback 规则端口，或提供另一条 Worker 可访问的受保护 HTTPS 地址；
4. 用 supervisor、容器或其他账号可用方式托管并自动重启；当前账号没有 user systemd；
5. 将同一服务 token 注入服务器私有环境和 Worker secret，并设置 `RULE_SERVICE_REQUIRED=true`；
6. 完成 Worker → HTTPS → Prolog → Story Session 的线上回合与开发工具验收；
7. 后续提供 AlterU 服务端签名用户身份，而不是仅由前端传 `user_id`。

第 3–6 项完成后才能把第一款实验称为正式发布；第 7 项是开放给普通用户制作游戏之前的生产门禁。
