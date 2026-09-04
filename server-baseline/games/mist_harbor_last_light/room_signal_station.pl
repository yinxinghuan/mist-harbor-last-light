%% room(+Id, +Name, +Description, +Flags, +ExitsList)
:- assertz(room(signal_station, '旧港信号站',
    '暴风雨压着海窗。黄铜控制台已经熄灭，远处渡船回了一次短促白光。',
    [lit], [down(relay_room), east(lower_quay)])).

%% object(+Id, +Name, +Description, +ExamineText, +InitialText, +Flags, +Location, +Capacity, +Size, +Value)
:- assertz(object(control_console, '黄铜控制台', '熄灭的主控继电器和一排烧黑的触点。',
    '值班牌说明：先确认继电器，再寻找绝缘铜线与聚光镜片。', '', [readable], signal_station, 0, 4, 0)).
:- assertz(object(storm_lantern, '风暴提灯', '一盏装有少量灯油的黄铜风暴提灯。', '', '',
    [takeable, light, tool], signal_station, 0, 2, 0)).
:- assertz(object(relay_box, '旧继电器盒', '林芮带来的旧继电器盒，黄铜搭扣仍然能用。', '', '',
    [container, closed], signal_station, 4, 3, 0)).
:- assertz(object(relay_key, '继电器钥匙', '一把刻着旧港编号的机械钥匙。', '', '',
    [takeable, tool], relay_box, 0, 1, 0)).
