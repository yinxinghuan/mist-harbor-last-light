# 《雾港最后一盏灯》新服务器接入协助说明

> **状态更新（2026-09-04 21:55 后）：SSH 公钥问题已解决。** 专用密钥已经可以登录，SWI-Prolog 10.1.13、原始框架、Zork 与《雾港》均已完成真实服务器测试。本文第 3–5 节保留为历史故障记录，不再需要同事继续排查 authorized_keys。
>
> **当前需要同事支持的事项已经缩小为：** Worker 可访问的受保护 HTTPS 网关和进程托管。服务端 token 验证、64 KiB 请求上限以及“只开放 `/health` 与 `/v1/resolve`”的生产收口已经实现并通过 SSH 隧道实测。完整结果见 [`../server-baseline/BASELINE_REPORT.md`](../server-baseline/BASELINE_REPORT.md)。

日期：2026-09-04
用途：请协助开通 Prolog 部署账号的 SSH 公钥权限，并确认后续规则服务部署条件。

## 1. 实验目标

这次实验需要把《雾港最后一盏灯》的确定性游戏规则部署到新服务器上的 SWI-Prolog 服务中，并由 AlterU Story Session Worker 通过受保护的 HTTPS 接口调用。

目标链路如下：

```text
AlterU 玩家
  → 游戏前端
  → Story Session Worker
      ├─ Durable Object：用户会话、存档、版本和并发控制
      ├─ game-chat：自由叙事生成
      └─ 新服务器上的 Prolog：关键游戏规则判定
```

Prolog 服务不保存用户资料、完整存档或剧情正文，只接收动作 ID 和经过裁剪的权威状态，返回规则是否允许以及对应效果。

如果没有把 Prolog 服务真正部署到新服务器并完成 Worker 联调，本次工作只能算本地架构预演，不能算完成新结构实验。

## 2. 当前 SSH 连接信息

```text
Host: connect.westb.seetacloud.com
Port: 23001
User: prolog
```

使用的连接命令：

```bash
ssh \
  -i ~/.ssh/alteru_prolog_ed25519 \
  -o IdentitiesOnly=yes \
  -p 23001 \
  prolog@connect.westb.seetacloud.com
```

## 3. 历史故障现象（已解决）

网络连接、SSH 握手和服务器主机密钥验证均成功。对端为 Ubuntu OpenSSH 服务器，并且声明支持 `publickey,password`。

本机明确提交了指定的 ED25519 公钥，但服务器没有接受：

```text
Offering public key: ED25519 SHA256:+cQl1JMskWL/ojJ7ae/ayYv4WnJ7XRA58VQ8eI6Ttf0
Authentications that can continue: publickey,password
Permission denied (publickey,password)
```

因此当前问题不在域名、端口或本机密钥选择，而在服务器端的用户/公钥授权环节。

最可能的原因包括：

- 公钥尚未加入 `prolog` 用户的 `authorized_keys`；
- 公钥加入了错误用户、错误 home 目录或错误服务器实例；
- `.ssh` 目录、`authorized_keys` 的权限或所有权不符合 sshd 要求；
- `prolog` 用户被锁定、过期或禁止 SSH 登录；
- `AllowUsers`、`DenyUsers` 或 `Match User` 规则限制了该账号；
- 云平台端口映射到了另一台或已经重建的实例。

## 4. 请安装的公钥

请把下面这一整行加入服务器上 `prolog` 用户实际 home 目录的 `~prolog/.ssh/authorized_keys`：

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJya8kwHePhhXxygr3RfVmP4rYZaCA62/RC+OR5KbOie alteru-prolog-deploy-2026-09-04
```

公钥指纹：

```text
SHA256:+cQl1JMskWL/ojJ7ae/ayYv4WnJ7XRA58VQ8eI6Ttf0
```

这只是公钥，可以用于服务器授权。私钥保留在本机，不会发送，也不需要服务器同事获取。

## 5. 建议的服务器端检查

请先确认 `23001` 映射到预期实例，并检查账号：

```bash
getent passwd prolog
```

安装公钥后确认目录、文件所有权和权限：

```bash
chown -R prolog:prolog ~prolog/.ssh
chmod 700 ~prolog/.ssh
chmod 600 ~prolog/.ssh/authorized_keys
```

检查 sshd 的有效配置：

```bash
sshd -T | grep -E 'pubkeyauthentication|authorizedkeysfile|allowusers|denyusers'
```

需要确认至少允许公钥认证：

```text
PubkeyAuthentication yes
```

如仍被拒绝，请查看认证日志：

```bash
journalctl -u ssh -n 100
```

或者：

```bash
journalctl -u sshd -n 100
```

Ubuntu 也可检查：

```bash
tail -n 100 /var/log/auth.log
```

## 6. SSH 开通后需要的部署条件（当前阶段）

SSH 公钥已经可用。服务器上 `/home/prolog/game_logic1` 的原始框架与同事提供包一致，本项目兼容层位于 `/home/prolog/alteru-prolog-experiment`。目前仍需要服务器支持以下条件：

1. 已确认 SWI-Prolog 10.1.13 可用；
2. 已确认可在普通 `prolog` 用户目录上传并运行服务；
3. 提供 supervisor、容器或其他可用的进程托管方式并自动重启；当前 user systemd 不可用，现有 `nohup` 只用于受控实验；
4. Prolog HTTP 服务只监听 `127.0.0.1` 或私有网络；
5. 提供一个可被 Story Session Worker 访问的受保护 HTTPS 地址；
6. HTTPS/私网网关只转发 Prolog 兼容层的 `/health` 和 `/v1/resolve`，不得转发原始 `/consult`；
7. 服务间 token 通过服务器和 Worker secret 注入，不写入源码；
8. 明确日志目录、端口、防火墙和 TLS 证书的管理方式。

当前受控实验使用的服务端内部监听配置：

```text
RULE_SERVICE_BIND=127.0.0.1
RULE_SERVICE_PORT=8000
RULE_SERVICE_TOKEN=<由服务器安全生成和保存的随机值>
```

请不要把真实 token 写进聊天、Git、前端环境变量或公开部署包。

## 7. 已完成与待完成验收

已完成：

1. 公钥登录与 SWI-Prolog 版本确认；
2. 原框架文件 hash 对比；
3. Zork 与《雾港》基础路由；
4. `/health`、`/game/action`、`/game/state` 与 `/v1/resolve`；
5. 完整《雾港》规则链；
6. Story Session → SSH 隧道 → 真实 SWI-Prolog；
7. 原始/扩展并发对比。
8. 生产 listener 的 token 验证、请求体上限和管理路由 404；
9. 生产 listener 通过 SSH 隧道再次完成 10 动作章节。

待完成：

1. 把 `https://uu545921-zfkm-aec62664.westb.seetacloud.com:8443` 代理到 `127.0.0.1:8000`，或提供新的受保护 HTTPS 网关；当前 `/health` 为云平台 404；
2. 配置 supervisor/容器进程托管；
3. 给 Story Session Worker 设置：

```text
RULE_SERVICE_URL
RULE_SERVICE_TOKEN
RULE_SERVICE_REQUIRED=true
```

4. 运行 Worker → HTTPS/私网网关 → Prolog → Story Session 写入闭环；
5. 使用两个真实 AlterU 用户验证存档和会话隔离；
6. 完成发布前扫描与线上回归后再发布。

## 8. 请协助回复的信息

完成排查后，请回复：

- 公钥是否已经安装到正确实例的 `prolog` 用户；
- `prolog` 用户的实际 home 目录；
- 是否已安装 SWI-Prolog及版本；
- 建议使用 systemd、supervisor 还是容器托管；
- 可使用的内部端口；
- HTTPS 域名或反向代理由谁配置；
- Worker secret 由谁负责设置；
- 如果仍无法登录，请提供 sshd 认证日志中对应时间的拒绝原因。
