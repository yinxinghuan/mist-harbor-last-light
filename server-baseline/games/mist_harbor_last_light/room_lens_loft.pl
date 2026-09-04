:- assertz(room(lens_loft, '聚光室',
    '主灯的黄铜骨架面对暴风海面，控制线断口和缺失镜片的位置清晰可见。',
    [lit], [down(lower_quay)])).

:- assertz(object(repair_guide, '主灯维修卡', '夹在灯架上的防水维修卡。',
    '完成修复需要绝缘铜线、菲涅尔镜片，以及至少一名熟悉旧港设备的协助者。', '',
    [readable], lens_loft, 0, 1, 0)).
:- assertz(object(main_signal, '旧港主灯', '等待重新接线和安装镜片的黄铜主灯。', '', '',
    [visible], lens_loft, 0, 8, 0)).
