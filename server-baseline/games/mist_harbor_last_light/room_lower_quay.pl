:- assertz(room(lower_quay, '下码头',
    '退潮石线露在黑水边缘，弧形镜片卡在一条湿滑石缝中。',
    [onwater], [west(signal_station), up(lens_loft)])).

:- assertz(object(fresnel_fragment, '菲涅尔镜片', '从旧港主灯上脱落的弧形聚光镜片。', '', '',
    [takeable, tool], lower_quay, 0, 3, 0)).
