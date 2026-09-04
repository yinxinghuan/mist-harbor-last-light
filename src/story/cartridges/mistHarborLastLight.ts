import type {
  InventoryItem,
  StoryCartridge,
  StoryDangerDirector,
  StoryDirector,
  StoryDomainRules,
  StoryImageDirector,
} from '../types'

const coverImage = new URL('../img/worlds/mist-harbor-last-light.png', import.meta.url).href
const entryImage = new URL('../img/worlds/mist-harbor-last-light-entry.png', import.meta.url).href

function stormLantern(locale: 'zh' | 'en'): InventoryItem {
  const zh = locale === 'zh'
  return {
    id: 'storm-lantern',
    label: zh ? '风暴提灯' : 'Storm Lantern',
    count: 1,
    rarity: 'rare',
    detail: zh
      ? '旧黄铜框护着磨砂灯罩，底部油仓只够三次高亮照明。'
      : 'An old brass cage protects frosted glass above an oil cup good for three bright uses.',
    effect: zh
      ? '照亮被淹通道和设备刻痕；每次高亮照明消耗一格灯油。'
      : 'Reveals flooded footing and machine marks; each bright use spends one oil charge.',
    lore: zh
      ? '上一任守灯人把它留在值班桌旁，提梁内侧刻着三道修补痕。'
      : 'The previous keeper left it beside the duty desk. Three repair cuts mark the inner handle.',
    metrics: [{ id: 'lantern-charge', label: zh ? '剩余灯油' : 'Oil remaining', value: zh ? '3 格' : '3 charges' }],
    imagePrompt: 'single old storm lantern with weathered brass cage, frosted glass and three repair cuts inside the handle, salt-stained harbor evidence still life, object only, no people, no readable text, square',
  }
}

function copperWire(locale: 'zh' | 'en'): InventoryItem {
  const zh = locale === 'zh'
  return {
    id: 'insulated-wire',
    label: zh ? '绝缘铜线' : 'Insulated Copper Wire',
    count: 1,
    detail: zh ? '从旧继电器旁拆出的短铜线，黑色布绝缘层仍然干燥。' : 'A short copper lead removed beside the old relay; its black cloth insulation is still dry.',
    effect: zh ? '可替换信号灯烧断的控制线，只够完成一次正式修复。' : 'Can replace the signal lamp control lead; enough for one proper repair.',
    lore: zh ? '旧港设备统一使用这种粗线，修理记录显示仓库已经停产多年。' : 'Old harbor equipment used this gauge throughout; the maintenance record says it has been unavailable for years.',
    metrics: [{ id: 'wire-length', label: zh ? '可用长度' : 'Usable length', value: zh ? '42 厘米' : '42 cm' }],
    imagePrompt: 'single short coil of old insulated copper wire with intact black cloth wrapping and brass terminal, harbor repair evidence still life, object only, no people, no readable text, square',
  }
}

function lensFragment(locale: 'zh' | 'en'): InventoryItem {
  const zh = locale === 'zh'
  return {
    id: 'fresnel-fragment',
    label: zh ? '菲涅尔镜片' : 'Fresnel Lens Fragment',
    count: 1,
    rarity: 'rare',
    detail: zh ? '从退潮石缝里取出的厚弧形玻璃，边缘仍卡着两枚铜钉。' : 'A thick curved glass fragment recovered from a tide crack, with two copper pins still caught at its edge.',
    effect: zh ? '补齐主灯缺失的聚光环；安装后能把信号送出防波堤。' : 'Completes the missing focusing ring so the main signal can carry beyond the breakwater.',
    lore: zh ? '安雅认出它来自三年前风暴中坠落的旧港灯罩。' : 'Anya recognizes it from the old harbor lens lost in the storm three years ago.',
    metrics: [{ id: 'lens-arc', label: zh ? '弧面完整度' : 'Arc integrity', value: '78%' }],
    imagePrompt: 'single thick curved Fresnel lens fragment with two weathered copper pins, cold seawater droplets, archival harbor object study, no people, no readable text, square',
  }
}

function director(locale: 'zh' | 'en'): StoryDirector {
  const zh = locale === 'zh'
  return {
    mode: 'guided',
    fixedWorldRules: zh ? [
      '潮汐只由已提交回合和确定性规则推进；已确认的人物位置、物品归属、门锁、设备、承诺和后果不能静默改写。',
      '林芮在开场可见登场。安雅在下码头被可见介绍之前不能出现在人物面板、目标、对白或行动选择中。',
      '角色只知道自己亲眼见到、被告知或从可靠记录读到的事实；叙事不能把猜测改写成已证实真相。',
      'Prolog 负责条件和效果判定，Story Session 是唯一持久化写入者；正文从来不是状态数据库。',
    ] : [
      'The tide advances only through committed turns and deterministic rules. Confirmed locations, ownership, locks, equipment, promises and consequences cannot be silently rewritten.',
      'Lin Rui is visibly introduced in the opening. Anya cannot appear in the roster, objective, dialogue or choices before her visible debut at the Lower Quay.',
      'People know only what they witnessed, were told, or read in a reliable record. Narration cannot turn suspicion into confirmed truth.',
      'Prolog adjudicates requirements and effects while Story Session is the only persistent writer. Prose is never the state database.',
    ],
    generationRules: zh ? [
      '每个有效回合至少改变位置、线索、关系、物资、设备或潮汐事实中的一项。',
      'AI 可以补充天气、港工往事、局部传闻和不改变规则的小冲突，但不能创造免费零件、凭空修复设备或跳过条件路线。',
      '失败造成绕路、灯油损失、镇定下降、信任下降或救援窗口缩短，不删除存档。',
    ] : [
      'Every valid turn changes at least one location, clue, relationship, supply, equipment or tide fact.',
      'AI may add weather, dockworker history, local rumors and small non-rule-changing conflicts, but cannot mint free parts, repair equipment by prose, or bypass gated routes.',
      'Failure causes a detour, lost oil, reduced resolve or trust, or a narrower rescue window. It never deletes the save.',
    ],
    choiceIntents: zh
      ? ['调查地点、设备或记录', '移动、取用物品或修复设施', '向港区角色求助、交换信息或承担风险']
      : ['inspect a place, machine, or record', 'move, take an item, or repair equipment', 'ask for help, exchange information, or accept a risk'],
    maxActiveThreads: 3,
  }
}

function dangerDirector(locale: 'zh' | 'en'): StoryDangerDirector {
  const zh = locale === 'zh'
  const tide = zh ? '涨潮淹没原来的港区通道' : 'the rising tide is flooding the previous harbor passage'
  const circuit = zh ? '暴风切断刚恢复的临时电路' : 'the storm is cutting the temporary circuit'
  const falseSignal = zh ? '浓雾中同时出现两种相互矛盾的灯号' : 'two contradictory lights are appearing in the fog'
  const ferry = zh ? '失联渡船在错误航道留下短暂灯影' : 'the missing ferry is flashing from the wrong channel'
  return {
    minSafeTurns: 2,
    maxSafeTurns: 4,
    cooldownTurns: 2,
    graceScenes: 2,
    escalationStats: ['resolve', 'trust', 'signal'],
    threatPalette: [tide, circuit, falseSignal, ferry],
    threatLocations: {
      [tide]: ['lower-quay', 'breakwater'],
      [circuit]: ['signal-station', 'relay-room', 'lens-loft'],
      [falseSignal]: ['signal-station', 'lens-loft', 'breakwater'],
      [ferry]: ['lower-quay', 'lens-loft', 'breakwater'],
    },
    methods: zh
      ? ['用风暴提灯确认下一段落脚点', '请已经取得信任的港工带路', '退回信号站重新规划路线']
      : ['Use the storm lantern to mark the next footing', 'Ask a trusted harbor worker to lead the way', 'Return to the signal station and replan'],
    physicalCombat: 'none',
    resolution: {
      skill: zh ? '港区应变' : 'Harbor Response',
      modifier: 1,
      dcBySeverity: [8, 10, 12, 14, 16],
      criticalDcBonus: 3,
      fallbackCosts: [{ statId: 'resolve', operation: 'remove', amount: 1 }],
    },
  }
}

function domainRules(locale: 'zh' | 'en'): StoryDomainRules {
  const zh = locale === 'zh'
  const t = (zhText: string, enText: string) => zh ? zhText : enText
  return {
    derivedItemMetrics: [
      { itemId: 'storm-lantern', metricId: 'lantern-charge', label: t('剩余灯油', 'Oil remaining'), factId: 'lantern-uses', maximum: 3, mode: 'remaining-from-used' },
    ],
    rules: [
      {
        id: 'take-storm-lantern', intent: t('拿起风暴提灯', 'take the storm lantern'),
        match: [t('拿起风暴提灯并试亮', 'Take the storm lantern and test it')], matchMode: 'exact', dangerPolicy: 'suppress', successContinuation: 'replace', rejectionContinuation: 'derive',
        requirements: [{ type: 'fact', id: 'lantern-taken', equals: false, reason: t('风暴提灯已经在你的行囊里', 'The storm lantern is already in your kit') }],
        effects: [
          { type: 'fact', id: 'lantern-taken', value: true },
          { type: 'inventory', action: 'add', itemId: 'storm-lantern', count: 1, item: stormLantern(locale) },
          { type: 'objective', value: t('查明主灯熄灭的原因，并找到可用的修复零件', 'Find why the main light failed and locate usable repair parts') },
        ],
        successText: t('你提起值班桌旁的旧灯，调低灯芯再推回安全罩。火焰在磨砂玻璃后稳定下来，油仓上的三格刻度全部可见。它现在属于你的随身装备，而不是叙事里的一件背景道具。', 'You lift the old lamp beside the duty desk, lower the wick, and slide the guard home. The flame steadies behind frosted glass, revealing all three marks on the oil cup. It is now carried equipment rather than a prop in the story.'),
        successChoices: [t('检查主控继电器为什么熄灭', 'Inspect why the main relay went dark'), t('问林芮她带来的继电器盒是什么', 'Ask Lin Rui about the relay box she brought'), t('用提灯照开继电器室的窄门', 'Use the lantern at the relay-room door')],
        rejectionChoices: [t('检查主控继电器为什么熄灭', 'Inspect why the main relay went dark'), t('查看风暴提灯剩余灯油', 'Check the storm lantern oil'), t('问林芮主灯最后一次正常亮起是什么时候', 'Ask Lin Rui when the main light last held steady')],
      },
      {
        id: 'inspect-main-relay', intent: t('检查主控继电器', 'inspect the main relay'),
        match: [t('检查主控继电器为什么熄灭', 'Inspect why the main relay went dark')], matchMode: 'exact', dangerPolicy: 'suppress', successContinuation: 'replace', rejectionContinuation: 'derive',
        requirements: [
          { type: 'map', nodeId: 'signal-station', reason: t('主控继电器位于信号站内', 'The main relay is inside the signal station') },
          { type: 'fact', id: 'relay-inspected', equals: false, reason: t('烧断位置已经查明', 'The burned contact has already been identified') },
        ],
        effects: [
          { type: 'fact', id: 'relay-inspected', value: true },
          { type: 'fact', id: 'relay-needs-wire', value: true },
          { type: 'objective', value: t('找到绝缘铜线和缺失镜片，再恢复主灯信号', 'Find insulated wire and the missing lens, then restore the main signal') },
        ],
        successText: t('你没有重新合闸，而是先沿焦痕找到烧断的控制触点。主灯不是缺电：一段绝缘铜线被高温熔开，聚光环也少了一片玻璃。现在故障被拆成了两个可以验证的条件。', 'You resist closing the switch and trace the scorch instead. The station still has power: one insulated lead melted through, and the focusing ring is missing a piece of glass. The failure is now two testable requirements rather than one vague outage.'),
        successChoices: [t('问林芮继电器室的备用线在哪里', 'Ask Lin Rui where the spare relay wire is kept'), t('用提灯照开继电器室的窄门', 'Use the lantern at the relay-room door'), t('查看值班记录里最后一次镜片检修', 'Check the duty log for the last lens repair')],
        rejectionChoices: [t('问林芮继电器室的备用线在哪里', 'Ask Lin Rui where the spare relay wire is kept'), t('用提灯照开继电器室的窄门', 'Use the lantern at the relay-room door')],
      },
      {
        id: 'earn-lin-trust', intent: t('向林芮询问故障', 'ask Lin Rui about the failure'),
        match: [t('问林芮她带来的继电器盒是什么', 'Ask Lin Rui about the relay box she brought'), t('问林芮继电器室的备用线在哪里', 'Ask Lin Rui where the spare relay wire is kept')], matchMode: 'exact', dangerPolicy: 'suppress', successContinuation: 'replace', rejectionContinuation: 'derive',
        requirements: [{ type: 'fact', id: 'lin-key-given', equals: false, reason: t('林芮已经把继电器室钥匙交给你', 'Lin Rui has already given you the relay-room key') }],
        effects: [
          { type: 'fact', id: 'lin-key-given', value: true },
          { type: 'stat', id: 'trust', delta: 1 },
          { type: 'inventory', action: 'add', itemId: 'relay-key', count: 1, item: { id: 'relay-key', label: t('继电器室钥匙', 'Relay-room Key'), count: 1, detail: t('带扁平黄铜牌的短钥匙，齿槽被海盐磨亮。', 'A short key with a flat brass tag, its cuts polished by salt.'), effect: t('打开信号站下层的继电器室和下码头检修门。', 'Opens the relay room and the maintenance door to the Lower Quay.'), lore: t('林芮说明钥匙原本由夜班机械员保管。', 'Lin Rui says the night mechanic normally keeps it.'), imagePrompt: 'single short old brass maintenance key with flat blank tag and salt-polished cuts, harbor evidence still life, object only, no readable text, square' } },
        ],
        successText: t('雨披下的人把继电器盒放到桌上。她先指出盒角被海水咬出的白斑，才说自己叫林芮，是今晚唯一赶回旧港的机械员。她承认备用线还在下层，并把一把短钥匙推给你：她愿意让你接手，但会记住你怎样使用它。', 'The figure under the rain cape sets the relay box on the desk and points to salt bloom at its corner before giving her name: Lin Rui, the only mechanic who returned to the old harbor tonight. She says spare wire remains below and slides you a short key. She will let you take responsibility—and remember how you use it.'),
        successChoices: [t('检查主控继电器为什么熄灭', 'Inspect why the main relay went dark'), t('用提灯照开继电器室的窄门', 'Use the lantern at the relay-room door'), t('打开通往下码头的检修门', 'Open the maintenance door to the Lower Quay')],
        rejectionChoices: [t('用提灯照开继电器室的窄门', 'Use the lantern at the relay-room door'), t('打开通往下码头的检修门', 'Open the maintenance door to the Lower Quay')],
      },
      {
        id: 'enter-relay-room', intent: t('进入继电器室', 'enter the relay room'),
        match: [t('用提灯照开继电器室的窄门', 'Use the lantern at the relay-room door')], matchMode: 'exact', dangerPolicy: 'suppress', successContinuation: 'replace', rejectionContinuation: 'derive',
        requirements: [
          { type: 'map', nodeId: 'signal-station', reason: t('你必须从信号站进入继电器室', 'You must enter the relay room from the signal station') },
          { type: 'item', id: 'storm-lantern', minCount: 1, reason: t('窄梯没有照明，需要风暴提灯', 'The narrow stairs are dark; you need the storm lantern') },
          { type: 'item', id: 'relay-key', minCount: 1, reason: t('继电器室的机械锁需要林芮保管的钥匙', 'The relay room needs Lin Rui’s mechanical key') },
          { type: 'fact', id: 'lantern-uses', max: 2, reason: t('提灯已经没有足够灯油照亮窄梯', 'The lantern no longer has enough oil for the narrow stairs') },
        ],
        effects: [{ type: 'fact-add', id: 'lantern-uses', delta: 1 }, { type: 'map', nodeId: 'relay-room' }, { type: 'clock-add', minutes: 8 }],
        successText: t('钥匙转过半圈，风暴提灯把窄梯每一级湿亮的边缘依次照出来。你没有凭空“抵达”地下：路线经过值班图板、铁门和十二级台阶，最后停在旧继电器室。墙边一卷黑布绝缘铜线仍然干燥。', 'The key turns half a circle. The storm lantern reveals each wet stair edge in order. You do not simply appear below: the route passes the duty chart, iron door, and twelve steps before ending in the old relay room. A coil of black-cloth insulated copper wire remains dry by the wall.'),
        successChoices: [t('取下仍然干燥的绝缘铜线', 'Take the dry insulated copper wire'), t('检查继电器室是否还有第二处故障', 'Inspect the relay room for a second fault'), t('沿值班图板标记返回信号站', 'Return to the signal station by the duty-chart marks')],
        rejectionChoices: [t('拿起风暴提灯并试亮', 'Take the storm lantern and test it'), t('问林芮她带来的继电器盒是什么', 'Ask Lin Rui about the relay box she brought')],
      },
      {
        id: 'take-insulated-wire', intent: t('取得绝缘铜线', 'take the insulated wire'),
        match: [t('取下仍然干燥的绝缘铜线', 'Take the dry insulated copper wire')], matchMode: 'exact', dangerPolicy: 'suppress', successContinuation: 'replace', rejectionContinuation: 'derive',
        requirements: [
          { type: 'map', nodeId: 'relay-room', reason: t('绝缘铜线留在继电器室', 'The insulated wire is in the relay room') },
          { type: 'fact', id: 'wire-taken', equals: false, reason: t('这卷可用铜线已经被取走', 'The usable wire has already been taken') },
        ],
        effects: [{ type: 'fact', id: 'wire-taken', value: true }, { type: 'inventory', action: 'add', itemId: 'insulated-wire', count: 1, item: copperWire(locale) }, { type: 'stat', id: 'signal', delta: 1 }],
        successText: t('你剪下没有受潮的四十二厘米铜线，保留两端黄铜接头。线材进入行囊后，主灯修复从“可能”变成了一项已经满足的条件；仍缺的是聚光镜片。', 'You cut forty-two dry centimeters of copper lead, keeping both brass terminals. Once it enters the kit, the main-light repair changes from a possibility into one satisfied requirement. The focusing lens is still missing.'),
        successChoices: [t('沿值班图板标记返回信号站', 'Return to the signal station by the duty-chart marks'), t('检查继电器室是否还有第二处故障', 'Inspect the relay room for a second fault')],
        rejectionChoices: [t('沿值班图板标记返回信号站', 'Return to the signal station by the duty-chart marks')],
      },
      {
        id: 'return-from-relay', intent: t('返回信号站', 'return to the signal station'),
        match: [t('沿值班图板标记返回信号站', 'Return to the signal station by the duty-chart marks')], matchMode: 'exact', dangerPolicy: 'suppress', successContinuation: 'replace', rejectionContinuation: 'derive',
        requirements: [{ type: 'map', nodeId: 'relay-room', reason: t('你目前不在继电器室', 'You are not in the relay room') }],
        effects: [{ type: 'map', nodeId: 'signal-station' }, { type: 'clock-add', minutes: 5 }],
        successText: t('你循着值班图板上的白漆编号回到信号站。林芮在主控台旁留出了接线位置，通往下码头的检修门仍在雨里震动。', 'You follow the white duty-chart numbers back to the signal station. Lin Rui has cleared a wiring space beside the main console, while the Lower Quay maintenance door still shakes in the rain.'),
        successChoices: [t('打开通往下码头的检修门', 'Open the maintenance door to the Lower Quay'), t('检查主控继电器为什么熄灭', 'Inspect why the main relay went dark')],
      },
      {
        id: 'descend-lower-quay', intent: t('前往下码头', 'go to the Lower Quay'),
        match: [t('打开通往下码头的检修门', 'Open the maintenance door to the Lower Quay')], matchMode: 'exact', dangerPolicy: 'advance', successContinuation: 'replace', rejectionContinuation: 'derive',
        requirements: [
          { type: 'map', nodeId: 'signal-station', reason: t('下码头检修门位于信号站外侧', 'The Lower Quay maintenance door is beside the signal station') },
          { type: 'item', id: 'relay-key', minCount: 1, reason: t('检修门需要继电器室钥匙', 'The maintenance door needs the relay-room key') },
          { type: 'fact', id: 'relay-inspected', equals: true, reason: t('你还没有确认主灯究竟缺少什么', 'You have not confirmed what the main light needs') },
        ],
        effects: [
          { type: 'map', nodeId: 'lower-quay' },
          { type: 'clock-add', minutes: 12 },
          { type: 'fact', id: 'anya-introduced', value: true },
          { type: 'party', change: 'add', characterId: 'anya' },
          { type: 'stat', id: 'trust', delta: 1 },
        ],
        successText: t('你从值班图板上划过下码头路线，穿过检修门和两段背风石阶。浪声在最后一个转角变得空旷。一名穿短黄雨衣的年轻人正用长钩从石缝里拨一块弧形玻璃；她先抬起钩杆示意没有敌意，随后说自己叫安雅，是今晚替渡船传信的码头跑腿。她想把镜片送回灯塔，也愿意带你走过退潮石线。', 'You mark the Lower Quay route on the duty chart, pass the maintenance door, and descend two sheltered flights. The waves open up around the final corner. A young runner in a short yellow raincoat is working a curved glass fragment from the stones with a long hook. She raises the hook to show no threat, then gives her name: Anya, the quay runner carrying messages for the ferry tonight. She wants the lens returned to the tower and offers to lead you across the ebb-stone line.'),
        successChoices: [t('请安雅带你取回石缝里的镜片', 'Ask Anya to lead you to the lens fragment'), t('先问安雅最后一次看见渡船灯号的位置', 'Ask where Anya last saw the ferry light'), t('检查退潮石线是否还能安全通过', 'Inspect whether the ebb-stone line is still passable')],
        rejectionChoices: [t('检查主控继电器为什么熄灭', 'Inspect why the main relay went dark'), t('问林芮她带来的继电器盒是什么', 'Ask Lin Rui about the relay box she brought')],
      },
      {
        id: 'recover-lens-fragment', intent: t('取回镜片', 'recover the lens fragment'),
        match: [t('请安雅带你取回石缝里的镜片', 'Ask Anya to lead you to the lens fragment')], matchMode: 'exact', dangerPolicy: 'suppress', successContinuation: 'replace', rejectionContinuation: 'derive',
        requirements: [
          { type: 'map', nodeId: 'lower-quay', reason: t('镜片卡在下码头的退潮石缝里', 'The fragment is caught in the Lower Quay tide crack') },
          { type: 'character', id: 'anya', status: 'companion', reason: t('需要安雅指认不会翻动的退潮石线', 'Anya must identify the stable side of the ebb-stone line') },
          { type: 'fact', id: 'lens-taken', equals: false, reason: t('聚光镜片已经从石缝里取回', 'The focusing fragment has already been recovered') },
        ],
        effects: [
          { type: 'fact', id: 'lens-taken', value: true },
          { type: 'stat', id: 'signal', delta: 1 },
          { type: 'inventory', action: 'add', itemId: 'fresnel-fragment', count: 1, item: lensFragment(locale) },
          { type: 'objective', value: t('把铜线与镜片带到聚光室，恢复主灯', 'Carry the wire and lens to the lens loft and restore the main light') },
        ],
        successText: t('安雅先把自己的长钩横在两块石头之间，再让你踩上不会翻动的那一侧。弧形玻璃离开石缝时，边缘的两枚铜钉还在。她没有在帮忙之后消失：她收起钩杆，明确说会同你一起把镜片送到聚光室。', 'Anya braces her long hook between two stones and points you to the side that will not roll. The curved glass comes free with both copper pins still attached. She does not vanish after helping: she folds the hook and explicitly agrees to carry the fragment with you to the lens loft.'),
        successChoices: [t('沿信号站外梯登上聚光室', 'Climb the signal-station ladder to the lens loft'), t('请安雅说明三年前镜片坠落的风暴', 'Ask Anya about the storm that dropped the lens'), t('在下码头核对渡船最后一次灯号', 'Check the ferry’s last light from the Lower Quay')],
        rejectionChoices: [t('沿信号站外梯登上聚光室', 'Climb the signal-station ladder to the lens loft'), t('检查退潮石线是否还能安全通过', 'Inspect whether the ebb-stone line is still passable')],
      },
      {
        id: 'climb-lens-loft', intent: t('前往聚光室', 'go to the lens loft'),
        match: [t('沿信号站外梯登上聚光室', 'Climb the signal-station ladder to the lens loft')], matchMode: 'exact', dangerPolicy: 'advance', successContinuation: 'replace', rejectionContinuation: 'derive',
        requirements: [
          { type: 'map', nodeId: 'lower-quay', reason: t('外梯从下码头一侧通往聚光室', 'The outside ladder reaches the lens loft from the Lower Quay side') },
          { type: 'item', id: 'fresnel-fragment', minCount: 1, reason: t('没有找回镜片，登上聚光室还不能完成修复', 'Without the recovered lens, climbing to the loft cannot complete the repair') },
          { type: 'item', id: 'insulated-wire', minCount: 1, reason: t('仍缺少替换烧断触点的绝缘铜线', 'The burned contact still needs insulated copper wire') },
        ],
        effects: [{ type: 'map', nodeId: 'lens-loft' }, { type: 'clock-add', minutes: 10 }],
        successText: t('你们先在值班图板上确认上行路线，再沿信号站外梯登到聚光室。主灯的黄铜骨架占据房间中央，缺口正好容下安雅带回的镜片；林芮从下方送来的接线夹已经挂在维修口。', 'You confirm the upward route on the duty chart before climbing the station ladder. The main lamp’s brass skeleton fills the loft. Its gap fits Anya’s recovered fragment exactly, and Lin Rui’s wiring clamp is waiting at the service opening below.'),
        successChoices: [t('用铜线、镜片和林芮的接线夹完成修复', 'Complete the repair with the wire, lens, and Lin Rui’s clamp'), t('先让安雅核对海上最后一次灯号', 'Have Anya check the last light at sea first')],
        rejectionChoices: [t('请安雅带你取回石缝里的镜片', 'Ask Anya to lead you to the lens fragment'), t('沿值班图板标记返回信号站', 'Return to the signal station by the duty-chart marks')],
      },
      {
        id: 'repair-main-signal', intent: t('修复主灯', 'repair the main signal'),
        match: [t('用铜线、镜片和林芮的接线夹完成修复', 'Complete the repair with the wire, lens, and Lin Rui’s clamp')], matchMode: 'exact', dangerPolicy: 'suppress', successContinuation: 'checkpoint', rejectionContinuation: 'derive',
        requirements: [
          { type: 'map', nodeId: 'lens-loft', reason: t('主灯只能在聚光室维修', 'The main light can be repaired only in the lens loft') },
          { type: 'item', id: 'insulated-wire', minCount: 1, reason: t('缺少绝缘铜线', 'The insulated copper wire is missing') },
          { type: 'item', id: 'fresnel-fragment', minCount: 1, reason: t('缺少聚光镜片', 'The focusing lens fragment is missing') },
          { type: 'stat', id: 'trust', min: 2, reason: t('至少需要一名港区角色愿意配合接线与校准', 'At least one harbor worker must trust you enough to help wire and align the lamp') },
          { type: 'fact', id: 'signal-repaired', equals: false, reason: t('主灯已经完成修复', 'The main light has already been repaired') },
        ],
        effects: [
          { type: 'inventory', action: 'remove', itemId: 'insulated-wire', count: 1 },
          { type: 'inventory', action: 'remove', itemId: 'fresnel-fragment', count: 1 },
          { type: 'fact', id: 'signal-repaired', value: true },
          { type: 'stat', id: 'signal', delta: 3 },
          { type: 'objective', value: t('观察主灯引导失联渡船进入安全航道', 'Watch the restored signal guide the missing ferry into the safe channel') },
          { type: 'clock', value: t('暴风夜 · 23:42', 'Storm night · 23:42') },
          { type: 'session', ended: true, reason: t('主灯恢复稳定归航信号', 'The main light now holds a stable homeward signal') },
        ],
        successText: t('你先固定镜片，再让林芮从维修口锁紧接线夹；安雅站在海窗边报告每一次远处回闪。合闸后，灯丝没有爆亮，而是缓慢升温。琥珀光穿过补齐的聚光环，在雾上形成一条稳定航线。几秒后，海面回了两短一长的灯号：渡船确认了安全入口。你们恢复的是信号，不是叙事里提前发生的靠岸。', 'You seat the lens before Lin Rui tightens the wiring clamp from the service opening. Anya calls each distant return flash from the sea window. When the circuit closes, the filament does not flare; it warms. Amber light passes through the completed ring and holds a stable channel across the fog. Seconds later, the sea answers with two short flashes and one long: the ferry has confirmed the safe entrance. You restored the signal—not a docking that has not happened yet.'),
        successChoices: [],
        rejectionChoices: [t('检查行囊里的修复零件', 'Inspect the repair parts in your kit'), t('请安雅核对海上最后一次灯号', 'Have Anya check the last light at sea first')],
      },
      {
        id: 'recover-breath', intent: t('稳住呼吸', 'steady your breathing'),
        match: [t('背靠干燥墙面稳住呼吸', 'Brace against a dry wall and steady your breathing')], matchMode: 'exact', dangerPolicy: 'suppress', successContinuation: 'resume', rejectionContinuation: 'resume',
        requirements: [], effects: [{ type: 'stat', id: 'resolve', delta: 1 }],
        successText: t('你找到一面不受风的墙，数清三次完整呼吸。暴风没有变小，但你的下一步重新变得具体。', 'You find a wall out of the wind and count three full breaths. The storm does not weaken, but your next action becomes concrete again.'), successChoices: [],
      },
      {
        id: 'recover-call-lin', intent: t('呼叫林芮', 'call Lin Rui'),
        match: [t('用值班线路呼叫林芮确认位置', 'Use the duty line to ask Lin Rui for bearings')], matchMode: 'exact', dangerPolicy: 'suppress', successContinuation: 'resume', rejectionContinuation: 'resume',
        requirements: [], effects: [{ type: 'stat', id: 'resolve', delta: 1 }],
        successText: t('旧值班线路里先响起继电器噪声，随后是林芮报出的方向和两处可避风标记。你不必靠猜测继续。', 'The old duty line answers with relay noise, then Lin Rui gives a bearing and two sheltered marks. You no longer have to continue by guessing.'), successChoices: [],
      },
      {
        id: 'recover-retreat-station', intent: t('撤回信号站', 'withdraw to the signal station'),
        match: [t('沿白漆标记撤回信号站', 'Follow the white marks back to the signal station')], matchMode: 'exact', dangerPolicy: 'withdraw', successContinuation: 'replace', rejectionContinuation: 'derive',
        requirements: [], effects: [{ type: 'map', nodeId: 'signal-station' }, { type: 'stat', id: 'resolve', delta: 2 }, { type: 'danger', outcome: 'failure' }],
        successText: t('你放弃当前推进，沿白漆编号一段段撤回信号站。代价是失去这次窗口，但路线、物品和已确认事实都被保住。', 'You give up the current advance and follow the white numbers back to the signal station. The window is lost, but the route, equipment, and confirmed facts remain intact.'), successChoices: [t('重新检查值班图板上的可行路线', 'Review the viable routes on the duty chart')],
      },
    ],
  }
}

const shared = {
  schemaVersion: 1 as const,
  id: 'mist-harbor-last-light',
  coverImage,
  entryImage,
  theme: {
    outer: '#09141D', surface: '#102430', paper: '#E6E0D2', ink: '#17242B', muted: '#7F9298', accent: '#C69A4A', danger: '#C45E4B', gold: '#F3B84B', material: 'harbor' as const,
  },
  itemImageDirection: 'archival old-harbor object study on wet dark wood and charcoal cloth, oxidized brass, controlled amber work light, grounded materials, object only, no people, no readable text',
  sceneImageDirection: 'editorial harbor mystery illustration during a blue-black storm night, wet timber, oxidized brass, restrained amber signal light, one clear action focus, grounded human scale, no UI, no readable text',
  sceneImageAvoid: 'neon cyberpunk colors, fantasy parchment, generic lighthouse postcard, duplicated opening composition, logos, signatures, readable signs or decorative pseudo-text',
  imageDirector: {
    maxQuietTurns: 4,
    softCooldownTurns: 2,
    guaranteedTriggers: ['new-location', 'rare-item', 'party-change', 'chapter-checkpoint', 'character-expression'],
    softTriggers: ['relationship-change', 'objective-change', 'skill-outcome'],
    perspective: { ordinary: 'balanced', importantDialogue: 'observer', newLocation: 'observer' },
  } satisfies StoryImageDirector,
  audioTheme: {
    material: 'harbor' as const,
    bpm: 52,
    rootHz: 110,
    scale: [0, 3, 5, 7, 10],
    levels: { music: .06, ambient: .08, sfx: .045, master: .24 },
    tension: [
      { statId: 'resolve', direction: 'low' as const, weight: .4 },
      { statId: 'trust', direction: 'low' as const, weight: .2 },
      { statId: 'signal', direction: 'low' as const, weight: .4 },
    ],
  },
}

export const mistHarborLastLight: StoryCartridge = {
  ...shared,
  locale: 'zh',
  transitionAnchor: '信号站值班图板上的白漆路线与当前潮位针',
  copy: {
    title: '雾港最后一盏灯', subtitle: '暴风夜的归航信号', promise: '每件工具、每条路线和每个承诺都会被世界记住。',
    enter: '接过夜班', continue: '继续守灯', customAction: '写下你要做的事',
    itemImagingTitle: '港务档案正在显影', itemImagingBody: '你把随身物品放上值班桌。档案会用旧港的黄铜、湿木与工作灯记录它们；第一件完成后，其余物品在后台继续。',
  },
  director: director('zh'), dangerDirector: dangerDirector('zh'), domainRules: domainRules('zh'),
  initialFacts: { 'lantern-taken': false, 'lantern-uses': 0, 'relay-inspected': false, 'relay-needs-wire': false, 'lin-key-given': false, 'wire-taken': false, 'anya-introduced': false, 'lens-taken': false, 'signal-repaired': false },
  statDefinitions: [
    { id: 'resolve', label: '镇定', min: 0, max: 6, initial: 4, inverse: true, display: 'number', warningAt: 2, dangerAt: 0, maxDelta: 2, description: '你在暴风和不确定信息下保持判断的能力。受挫会降低，安全确认与撤回能恢复；归零时只能先恢复或撤退。', floorRule: { enteredText: '风声和浪声压过了判断。继续冒险前，你必须先找回一个可靠的方向。', blockedText: '镇定已经归零，这个行动现在无法可靠执行。', recoveryChoices: ['背靠干燥墙面稳住呼吸', '用值班线路呼叫林芮确认位置', '沿白漆标记撤回信号站'], allowedDomainRuleIds: ['recover-breath', 'recover-call-lin', 'recover-retreat-station'] } },
    { id: 'trust', label: '港区信任', min: 0, max: 6, initial: 1, inverse: true, display: 'number', warningAt: 1, dangerAt: 0, maxDelta: 2, description: '港区角色愿意交付钥匙、信息和帮助的程度。兑现承诺会提高，利用或隐瞒会降低；关键修复至少需要 2。' },
    { id: 'signal', label: '信号稳定', min: 0, max: 6, initial: 1, inverse: true, display: 'bar', warningAt: 2, dangerAt: 0, maxDelta: 2, domainMaxDelta: 3, description: '归航信号已被验证的完整程度。零件和修复会提高；达到 6 才能形成稳定安全航道。' },
  ],
  drawerLabels: { party: '同行者', map: '港区图', inventory: '工具袋', log: '夜班日志' },
  opening: {
    location: '旧港信号站', time: '暴风夜 · 22:40', objective: '查明主灯为何熄灭，并恢复一条可信的归航信号',
    imagePrompt: 'inside an old harbor signal station during a blue-black storm night, dead brass relay console, one storm lantern on a duty desk, rain on wide sea windows and one faint white ferry flash offshore, editorial mystery illustration, no readable text, no UI, 16:9',
    blocks: [
      { id: 'mh0', kind: 'narration', text: '你接过夜班时，主灯还亮着。你刚把潮位针抄进值班簿，黄铜控制台便在一次闷响后全部熄灭。' },
      { id: 'mh1', kind: 'event', text: '雨窗外，海面回了一次短促白光。失联渡船还在等一个可信的归航信号。' },
      { id: 'mh2', kind: 'narration', text: '屋檐下，一名穿深橙雨披、抱着旧继电器盒的人先检查了门框是否带电，才推门进来。' },
      { id: 'mh3', kind: 'dialogue', speaker: '林芮', tone: '克制', text: '我叫林芮，负责旧港机械。别急着合闸——先确认是哪里断了。' },
    ],
    choices: [
      { id: 'take-lantern', label: '拿起风暴提灯并试亮' },
      { id: 'inspect-relay', label: '检查主控继电器为什么熄灭' },
      { id: 'ask-lin', label: '问林芮她带来的继电器盒是什么' },
    ],
  },
  characters: [
    { id: 'lin-rui', name: '林芮', role: '旧港机械员', vitality: 8, stress: 3, initialStatus: 'known', detail: '穿深橙雨披，先确认设备安全再开口；熟悉旧港继电器、检修门和停产零件。', lore: '她曾主张保留旧港手动信号系统，因此保存了最后一批可维修零件。', skills: [{ id: 'mechanics', label: '机械', value: 4 }, { id: 'harbor', label: '港区路线', value: 3 }] },
    { id: 'anya', name: '安雅', role: '码头跑腿', vitality: 7, stress: 2, hiddenUntilIntroduced: true, detail: '穿短黄雨衣，使用长钩确认退潮石线；能辨认海上渡船灯号。', lore: '三年前的风暴后，她一直替夜班船员传递手写信号和潮汐变化。', skills: [{ id: 'signals', label: '灯号', value: 4 }, { id: 'tide', label: '潮线', value: 3 }] },
  ],
  initialMap: [
    { id: 'signal-station', label: '旧港信号站', routeHints: ['旧港信号站', '信号站', '值班室', '控制台', '值班图板'], current: true, detail: '立在港区高处的木石值班站，黄铜主控台、值班图板和海窗都仍可使用。', lore: '自动灯塔启用后，这里只保留给风暴夜和主系统故障。', facts: ['主灯刚刚熄灭', '海面出现一次短促白光', '林芮已经可见登场'], capabilities: ['safe-rest', 'duty-line'] },
    { id: 'relay-room', label: '继电器室', routeHints: ['继电器室', '下层机房', '窄梯', '铁门'], connectedTo: '旧港信号站', detail: '信号站下层的狭窄机房，旧线圈、备用触点和停产零件按白漆编号存放。', lore: '夜班机械员靠机械钥匙进入；自动系统从未接管这里。', facts: ['没有固定照明', '可能保存绝缘铜线'], capabilities: ['relay-parts'] },
    { id: 'lower-quay', label: '下码头', routeHints: ['下码头', '退潮石线', '检修门', '石阶'], connectedTo: '旧港信号站', detail: '低于主堤的检修码头，退潮时能通向镜片坠落的石缝。', lore: '跑腿和机械员用这里避开装卸区；涨潮后大半石线会消失。', facts: ['弧形玻璃卡在退潮石缝', '海上灯号在这里最清楚'], capabilities: ['tide-line'] },
    { id: 'lens-loft', label: '聚光室', routeHints: ['聚光室', '主灯', '外梯', '灯塔上层'], connectedTo: '下码头', detail: '主灯黄铜骨架所在的上层房间，能同时看到内港和防波堤外侧。', lore: '旧港坚持让聚光环可以徒手校准，以便风暴时不依赖自动设备。', facts: ['主灯缺少一段控制线和一片镜片'], capabilities: ['main-signal-repair'] },
    { id: 'breakwater', label: '防波堤', routeHints: ['防波堤', '外港石堤', '浪墙'], connectedTo: '下码头', detail: '承受外海浪涌的长石堤，雾中只能依靠固定灯距判断位置。', lore: '它不是第一章必要路线，但保留给后续自由调查和危险事件。', facts: ['能直接观察渡船航道'] },
    { id: 'oil-shed', label: '灯油棚', routeHints: ['灯油棚', '补给棚', '油仓'], connectedTo: '旧港信号站', detail: '存放灯油和干燥布料的小棚，门锁在盐雾里容易卡死。', lore: '第一章只有这里能可靠补充一次风暴提灯。', facts: ['有一次可靠补充机会'], capabilities: ['lantern-refill'] },
  ],
  initialInventory: [
    { id: 'duty-card', label: '夜班值守卡', count: 1, detail: '防水硬纸卡记录三个紧急顺序：确认故障、确认路线、确认回闪。', effect: '提醒玩家按可验证事实推进；不能代替钥匙、零件或人物协助。', lore: '每位临时守灯人上岗时都会拿到一张，内容来自多次风暴事故复盘。', imagePrompt: 'single blank-looking waterproof harbor duty card with three embossed geometric marks but no readable text, brass clip, archival object still life, no people, square' },
  ],
  demoTurns: [
    { match: ['值班记录', '镜片检修'], content: `你翻到三年前的风暴夜。记录只确认一件事：聚光环缺失的镜片没有碎在塔内，而是落向下码头一侧。
[skill_check: skill="档案核对" dc="8" rolls="12" modifier="1" total="13" result="success"]
页脚的潮位标记与今晚相近。下码头的退潮石线仍可能在下一次涨潮前露出。
[choices: "问林芮继电器室的备用线在哪里"|"打开通往下码头的检修门"|"拿起风暴提灯并试亮"]` },
    { match: ['第二处故障', '继电器室'], content: `你沿线圈逐一检查，确认地下机房没有第二处短路。真正的断点仍在主控触点；这里最有价值的是那段保持干燥的绝缘铜线。
[choices: "取下仍然干燥的绝缘铜线"|"沿值班图板标记返回信号站"]` },
    { match: ['安雅', '三年前', '风暴'], content: `安雅说，三年前她还只负责收灯罩碎片。她记得这块弧形玻璃从未进入仓库，因为潮水先把它推入石缝。
[choices: "沿信号站外梯登上聚光室"|"在下码头核对渡船最后一次灯号"]` },
  ],
}

export const mistHarborLastLightEn: StoryCartridge = {
  ...shared,
  locale: 'en',
  transitionAnchor: 'the white-painted route on the station duty chart and its current tide needle',
  copy: {
    title: 'The Last Light of Mist Harbor', subtitle: 'A homeward signal in the storm', promise: 'The world remembers every tool, route, and promise.',
    enter: 'Take the night watch', continue: 'Continue the watch', customAction: 'Write what you do',
    itemImagingTitle: 'The harbor folio is developing', itemImagingBody: 'You place your equipment on the duty desk. The folio records it in old brass, wet timber, and work light; after the first plate, the rest continue quietly in the background.',
  },
  director: director('en'), dangerDirector: dangerDirector('en'), domainRules: domainRules('en'),
  initialFacts: { 'lantern-taken': false, 'lantern-uses': 0, 'relay-inspected': false, 'relay-needs-wire': false, 'lin-key-given': false, 'wire-taken': false, 'anya-introduced': false, 'lens-taken': false, 'signal-repaired': false },
  statDefinitions: [
    { id: 'resolve', label: 'Resolve', min: 0, max: 6, initial: 4, inverse: true, display: 'number', warningAt: 2, dangerAt: 0, maxDelta: 2, description: 'Your ability to judge under storm pressure and uncertain information. Setbacks lower it; safe confirmation and withdrawal restore it. At zero, recover or retreat first.', floorRule: { enteredText: 'Wind and surf have drowned out judgment. Recover one reliable bearing before taking another risk.', blockedText: 'Resolve is at zero, so this action cannot be carried out reliably.', recoveryChoices: ['Brace against a dry wall and steady your breathing', 'Use the duty line to ask Lin Rui for bearings', 'Follow the white marks back to the signal station'], allowedDomainRuleIds: ['recover-breath', 'recover-call-lin', 'recover-retreat-station'] } },
    { id: 'trust', label: 'Harbor Trust', min: 0, max: 6, initial: 1, inverse: true, display: 'number', warningAt: 1, dangerAt: 0, maxDelta: 2, description: 'How willing harbor people are to share keys, information, and help. Kept promises raise it; exploitation or concealment lowers it. The main repair needs at least 2.' },
    { id: 'signal', label: 'Signal Stability', min: 0, max: 6, initial: 1, inverse: true, display: 'bar', warningAt: 2, dangerAt: 0, maxDelta: 2, domainMaxDelta: 3, description: 'How much of the homeward signal has been verified. Parts and repairs raise it; a stable safe channel requires 6.' },
  ],
  drawerLabels: { party: 'Company', map: 'Harbor Chart', inventory: 'Tool Kit', log: 'Night Log' },
  opening: {
    location: 'Old Harbor Signal Station', time: 'Storm night · 22:40', objective: 'Find why the main light failed and restore one trustworthy homeward signal',
    imagePrompt: 'inside an old harbor signal station during a blue-black storm night, dead brass relay console, one storm lantern on a duty desk, rain on wide sea windows and one faint white ferry flash offshore, editorial mystery illustration, no readable text, no UI, 16:9',
    blocks: [
      { id: 'mh0', kind: 'narration', text: 'The main lamp was still burning when you took the night watch. You had barely copied the tide needle into the log when the brass console went dark with one muffled report.' },
      { id: 'mh1', kind: 'event', text: 'Beyond the rain window, the sea answers with one brief white flash. The missing ferry is still waiting for a trustworthy homeward signal.' },
      { id: 'mh2', kind: 'narration', text: 'Under the eaves, a figure in a deep-orange rain cape checks the doorframe for current before stepping inside with an old relay box.' },
      { id: 'mh3', kind: 'dialogue', speaker: 'Lin Rui', tone: 'restrained', text: 'I’m Lin Rui, old-harbor mechanic. Don’t close the circuit yet—first find where it broke.' },
    ],
    choices: [
      { id: 'take-lantern', label: 'Take the storm lantern and test it' },
      { id: 'inspect-relay', label: 'Inspect why the main relay went dark' },
      { id: 'ask-lin', label: 'Ask Lin Rui about the relay box she brought' },
    ],
  },
  characters: [
    { id: 'lin-rui', name: 'Lin Rui', role: 'Old-harbor mechanic', vitality: 8, stress: 3, initialStatus: 'known', detail: 'Wears a deep-orange rain cape and checks equipment before speaking; knows old relays, maintenance doors, and discontinued parts.', lore: 'She argued that the harbor should keep its manual signal system and preserved the last repairable stock.', skills: [{ id: 'mechanics', label: 'Mechanics', value: 4 }, { id: 'harbor', label: 'Harbor Routes', value: 3 }] },
    { id: 'anya', name: 'Anya', role: 'Quay runner', vitality: 7, stress: 2, hiddenUntilIntroduced: true, detail: 'Wears a short yellow raincoat and tests the ebb-stone line with a long hook; reads ferry light codes.', lore: 'Since the storm three years ago, she has carried handwritten signals and tide changes between night crews.', skills: [{ id: 'signals', label: 'Signals', value: 4 }, { id: 'tide', label: 'Tide Line', value: 3 }] },
  ],
  initialMap: [
    { id: 'signal-station', label: 'Old Harbor Signal Station', routeHints: ['Old Harbor Signal Station', 'signal station', 'duty room', 'console', 'duty chart'], current: true, detail: 'A timber-and-stone watch station above the harbor, with a brass console, duty chart, and working sea windows.', lore: 'After the automatic lighthouse opened, this station remained only for storm nights and main-system failure.', facts: ['The main lamp has just failed', 'One brief white light flashed at sea', 'Lin Rui has been visibly introduced'], capabilities: ['safe-rest', 'duty-line'] },
    { id: 'relay-room', label: 'Relay Room', routeHints: ['relay room', 'lower machine room', 'narrow stairs', 'iron door'], connectedTo: 'Old Harbor Signal Station', detail: 'A narrow room below the station where old coils, contacts, and discontinued parts follow white-painted numbers.', lore: 'The night mechanic enters with a physical key; automation never took over this room.', facts: ['No fixed lighting', 'May contain insulated copper wire'], capabilities: ['relay-parts'] },
    { id: 'lower-quay', label: 'Lower Quay', routeHints: ['Lower Quay', 'ebb-stone line', 'maintenance door', 'stone stairs'], connectedTo: 'Old Harbor Signal Station', detail: 'A maintenance quay below the main wall, exposed at low tide and leading to the crack where the lens fell.', lore: 'Runners and mechanics use it to avoid the loading yard. Most of the stone line disappears at high tide.', facts: ['A curved glass fragment is caught in a tide crack', 'Ferry lights are clearest here'], capabilities: ['tide-line'] },
    { id: 'lens-loft', label: 'Lens Loft', routeHints: ['lens loft', 'main light', 'outside ladder', 'upper tower'], connectedTo: 'Lower Quay', detail: 'The upper room around the main lamp’s brass skeleton, overlooking both inner harbor and breakwater.', lore: 'The old harbor kept its focusing ring adjustable by hand for storms that disabled automation.', facts: ['The main light is missing one control lead and one lens fragment'], capabilities: ['main-signal-repair'] },
    { id: 'breakwater', label: 'Breakwater', routeHints: ['breakwater', 'outer harbor wall', 'wave wall'], connectedTo: 'Lower Quay', detail: 'A long stone wall taking the open-sea swell. In fog, only fixed lamp spacing confirms position.', lore: 'Not required in chapter one, but available for later free investigation and danger events.', facts: ['Direct view of the ferry channel'] },
    { id: 'oil-shed', label: 'Oil Shed', routeHints: ['oil shed', 'supply shed', 'oil store'], connectedTo: 'Old Harbor Signal Station', detail: 'A small shed for lamp oil and dry cloth; its lock binds in salt fog.', lore: 'The only reliable lantern refill in the first chapter.', facts: ['One reliable refill remains'], capabilities: ['lantern-refill'] },
  ],
  initialInventory: [
    { id: 'duty-card', label: 'Night Duty Card', count: 1, detail: 'A waterproof card with three emergency orders: verify the fault, verify the route, verify the return flash.', effect: 'Reminds the player to proceed by confirmed facts; cannot replace keys, parts, or human help.', lore: 'Every temporary keeper receives one, revised from repeated storm-incident reviews.', imagePrompt: 'single blank-looking waterproof harbor duty card with three embossed geometric marks but no readable text, brass clip, archival object still life, no people, square' },
  ],
  demoTurns: [
    { match: ['duty log', 'lens repair'], content: `You find the storm-night entry from three years ago. It confirms only one fact: the missing focusing glass did not shatter inside the tower; it fell toward the Lower Quay.
[skill_check: skill="Archive Check" dc="8" rolls="12" modifier="1" total="13" result="success"]
The tide mark in the footer resembles tonight’s. The Lower Quay ebb-stone line may still emerge before the next rise.
[choices: "Ask Lin Rui where the spare relay wire is kept"|"Open the maintenance door to the Lower Quay"|"Take the storm lantern and test it"]` },
    { match: ['second fault', 'relay room'], content: `You follow every coil and confirm no second short below. The real break remains at the main contact; the dry insulated wire is the one useful thing here.
[choices: "Take the dry insulated copper wire"|"Return to the signal station by the duty-chart marks"]` },
    { match: ['Anya', 'storm', 'three years'], content: `Anya says she was only collecting lens debris during that storm. She remembers this curved glass never reached storage because the tide pushed it into the crack first.
[choices: "Climb the signal-station ladder to the lens loft"|"Check the ferry’s last light from the Lower Quay"]` },
  ],
}
