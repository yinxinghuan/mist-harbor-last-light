%% actor(+Id, +Name, +Description, +Location, +Health, +Hostile, +Active, +MessagesList)
:- assertz(actor(lin_rui, '林芮', '穿深橙雨披的旧港机械员。她先确认设备安全，再允许任何人靠近继电器。', signal_station, 8, false, true,
    [greet('我叫林芮。别急着合闸，先确认哪里断了。'),
     hear('继电器室里还有一卷停产前留下的绝缘铜线。')])).

:- assertz(actor(anya, '安雅', '穿短黄雨衣的码头跑腿，正用长钩确认退潮石线。', lower_quay, 7, false, true,
    [greet('我叫安雅。那片镜片卡在退潮石缝里，我知道怎么过去。'),
     hear('海上的短白光是渡船在等待归航信号。')])).
