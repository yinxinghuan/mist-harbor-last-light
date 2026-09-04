:- assertz(room(relay_room, '继电器室',
    '窄梯下方没有固定照明。旧线圈、备用触点和停产零件按白漆编号排列。',
    [], [up(signal_station)])).

:- assertz(object(insulated_wire, '绝缘铜线', '一卷仍然干燥的绝缘铜线。', '', '',
    [takeable, tool], relay_room, 0, 2, 0)).
