# 《雾港最后一盏灯》视觉 QA 报告

## Context

- 构建：本地 Vite + Story Session SQLite lab；模型为固定夹具，零线上写入。
- 目标：入口、开场、首个权威动作、完整确定性路线、完成、会话历史、异常恢复与外部访客栏。
- 规范：`doc/requirements.md`、`doc/visual.md`、`doc/screen-contract.md`。
- 视口：390×844、320×568。
- 证据：`_qa/ui/platform-layout-mist-harbor-*.png` 与 `_qa/ui/external-guest-mist-harbor-*.png`。

## Executive assessment

- 决定：视觉与交互纵向切片通过；服务器公网集成不属于本次视觉结论。
- 最强项：冷色港务日志、黄铜功能色和生成插画形成同一世界；累积正文与权威结果层级稳定。
- 最大剩余风险：真人首次理解尚无复述证据，保持 `comprehension unverified`。
- 最终 P0/P1/P2：0 / 0 / 2。

## Scorecard

| 类别 | 分数 | 证据 | 后续 |
|---|---:|---|---|
| Hierarchy | 4 | 入口、开场、首动作 | 真人理解测试 |
| Coherence | 4 | 入口图、完成图、黄铜/冷雾 UI | 后续生成图保持同一方向 |
| Readability | 4 | 中英窄屏、无横向页面溢出 | 长期内容继续抽样 |
| Game feel | 4 | 首动作、完成时 HUD 差值 | 真机音画同步仍待录屏 |
| Asset quality | 4 | 正式入口图、封面、海报 | 新角色锚点后续补充 |
| Responsive UX | 4 | 390×844、320×568、44 px 行 | 桌面视口发版前复查 |
| Polish | 4 | 会话历史、错误恢复、外部访客栏 | P2：英文顶栏可进一步扩展标题 tooltip |

平均：4.0；无低于 3 的类别。

## Findings and iteration

1. 首轮 P0：从继电器室返回信号站后，规则已提交但后续选择为空。原因是 `successContinuation='derive'` 没有对应推导器。已改为明确 `replace`，完整路线复验通过。
2. 首轮 P1：390 宽度中文标题把单个“灯”挤到第二行。已把入口标题调整为 `clamp(36px,11vw,52px)` 并缩小字距；同入口复验无孤字。
3. 剩余 P2：320 宽度英文顶栏会以省略号显示游戏名和状态标签；完整文字仍在入口、目标区和详情中，不阻塞行动。
4. 剩余 P2：完成画面的时间性音频/灯丝动效只做了静态峰值检查，真机音画同步需要后续视频证据。

## Foundation / art direction audit

- 无 Emoji 功能图标；SVG 线性图标家族一致。
- 行动和抽屉触控目标至少 44×44 px；滚动内容使用 `onClick`。
- 状态变化含文字和数值符号，不只依赖颜色。
- 平台画面不为外部访客栏预留空间；外部访客栏未遮住主按钮。
- 生成图光线、材质、冷暖关系和港务日志方向一致。
- 中英入口与首动作无页面横向滚动；选择条自身可横向浏览。

## Final recommendation

视觉纵向切片可以进入服务器集成验证。上线前仍需：真实 Prolog HTTPS 回合、正式 Worker secret、桌面补充截图、真机音画检查和真人首次理解验证。
