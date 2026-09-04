%% Game-specific rules for the AlterU extension route.
%% The original engine still owns sessions, actor/object locations and flags.

game_action(SessionId, ActorId, take_storm_lantern, Reply) :- !,
    ensure_mist_state(SessionId),
    (   actor_at(SessionId, ActorId, signal_station),
        item_at(SessionId, storm_lantern, signal_station)
    ->  move_entity(SessionId, storm_lantern, ActorId),
        set_fact(SessionId, lantern_taken),
        action_success(SessionId, ActorId, take_storm_lantern,
            '风暴提灯已经进入工具袋。', Reply)
    ;   action_rejected(SessionId, ActorId, take_storm_lantern,
            '风暴提灯不在这里，或已经被取走。', Reply)
    ).

game_action(SessionId, ActorId, inspect_main_relay, Reply) :- !,
    ensure_mist_state(SessionId),
    (   actor_at(SessionId, ActorId, signal_station),
        \+ has_fact(SessionId, relay_inspected)
    ->  set_fact(SessionId, relay_inspected),
        set_fact(SessionId, relay_needs_wire),
        action_success(SessionId, ActorId, inspect_main_relay,
            '烧断的控制触点已经确认：需要绝缘铜线与缺失镜片。', Reply)
    ;   action_rejected(SessionId, ActorId, inspect_main_relay,
            '只能在信号站检查尚未确认的主控故障。', Reply)
    ).

game_action(SessionId, ActorId, earn_lin_trust, Reply) :- !,
    ensure_mist_state(SessionId),
    (   actor_at(SessionId, ActorId, signal_station),
        \+ has_fact(SessionId, lin_key_given)
    ->  move_entity(SessionId, relay_key, ActorId),
        set_fact(SessionId, lin_key_given),
        add_stat(SessionId, trust, 1, 0, 6),
        action_success(SessionId, ActorId, earn_lin_trust,
            '林芮完成可见介绍并交出继电器室钥匙；港区信任提高。', Reply)
    ;   action_rejected(SessionId, ActorId, earn_lin_trust,
            '林芮已经交出钥匙，或你当前不在信号站。', Reply)
    ).

game_action(SessionId, ActorId, enter_relay_room, Reply) :- !,
    ensure_mist_state(SessionId),
    state_value(SessionId, lantern_uses, Uses),
    (   actor_at(SessionId, ActorId, signal_station),
        actor_holds(SessionId, ActorId, storm_lantern),
        actor_holds(SessionId, ActorId, relay_key),
        Uses < 3
    ->  move_entity(SessionId, ActorId, relay_room),
        NextUses is Uses + 1,
        set_value(SessionId, lantern_uses, NextUses),
        action_success(SessionId, ActorId, enter_relay_room,
            '钥匙和提灯满足前置条件；你沿窄梯进入继电器室。', Reply)
    ;   action_rejected(SessionId, ActorId, enter_relay_room,
            '进入继电器室需要在信号站持有提灯和钥匙，并且灯油未耗尽。', Reply)
    ).

game_action(SessionId, ActorId, take_insulated_wire, Reply) :- !,
    ensure_mist_state(SessionId),
    (   actor_at(SessionId, ActorId, relay_room),
        item_at(SessionId, insulated_wire, relay_room)
    ->  move_entity(SessionId, insulated_wire, ActorId),
        set_fact(SessionId, wire_taken),
        add_stat(SessionId, signal, 1, 0, 6),
        action_success(SessionId, ActorId, take_insulated_wire,
            '绝缘铜线已经进入工具袋；信号修复条件推进。', Reply)
    ;   action_rejected(SessionId, ActorId, take_insulated_wire,
            '绝缘铜线不在这里，或已经被取走。', Reply)
    ).

game_action(SessionId, ActorId, return_from_relay, Reply) :- !,
    ensure_mist_state(SessionId),
    (   actor_at(SessionId, ActorId, relay_room)
    ->  move_entity(SessionId, ActorId, signal_station),
        action_success(SessionId, ActorId, return_from_relay,
            '你沿白漆编号返回信号站。', Reply)
    ;   action_rejected(SessionId, ActorId, return_from_relay,
            '这条返回路线只能从继电器室执行。', Reply)
    ).

game_action(SessionId, ActorId, return_signal_station, Reply) :- !,
    game_action(SessionId, ActorId, return_from_relay, Reply).

game_action(SessionId, ActorId, descend_lower_quay, Reply) :- !,
    ensure_mist_state(SessionId),
    (   actor_at(SessionId, ActorId, signal_station),
        actor_holds(SessionId, ActorId, relay_key),
        has_fact(SessionId, relay_inspected)
    ->  move_entity(SessionId, ActorId, lower_quay),
        set_fact(SessionId, anya_introduced),
        add_stat(SessionId, trust, 1, 0, 6),
        action_success(SessionId, ActorId, descend_lower_quay,
            '你抵达下码头；安雅完成可见介绍并愿意同行。', Reply)
    ;   action_rejected(SessionId, ActorId, descend_lower_quay,
            '前往下码头前需要确认主灯故障并取得继电器室钥匙。', Reply)
    ).

game_action(SessionId, ActorId, recover_lens_fragment, Reply) :- !,
    ensure_mist_state(SessionId),
    (   actor_at(SessionId, ActorId, lower_quay),
        has_fact(SessionId, anya_introduced),
        item_at(SessionId, fresnel_fragment, lower_quay)
    ->  move_entity(SessionId, fresnel_fragment, ActorId),
        set_fact(SessionId, lens_taken),
        add_stat(SessionId, signal, 1, 0, 6),
        action_success(SessionId, ActorId, recover_lens_fragment,
            '安雅带你取回菲涅尔镜片；她不会在帮助后从状态中消失。', Reply)
    ;   action_rejected(SessionId, ActorId, recover_lens_fragment,
            '取回镜片需要你在下码头、已经认识安雅，且镜片尚未被取走。', Reply)
    ).

game_action(SessionId, ActorId, climb_lens_loft, Reply) :- !,
    ensure_mist_state(SessionId),
    (   actor_at(SessionId, ActorId, lower_quay),
        actor_holds(SessionId, ActorId, insulated_wire),
        actor_holds(SessionId, ActorId, fresnel_fragment)
    ->  move_entity(SessionId, ActorId, lens_loft),
        action_success(SessionId, ActorId, climb_lens_loft,
            '修复零件齐全；你沿外梯进入聚光室。', Reply)
    ;   action_rejected(SessionId, ActorId, climb_lens_loft,
            '登上聚光室前必须在下码头取得绝缘铜线和菲涅尔镜片。', Reply)
    ).

game_action(SessionId, ActorId, repair_main_signal, Reply) :- !,
    ensure_mist_state(SessionId),
    state_value(SessionId, trust, Trust),
    (   actor_at(SessionId, ActorId, lens_loft),
        actor_holds(SessionId, ActorId, insulated_wire),
        actor_holds(SessionId, ActorId, fresnel_fragment),
        Trust >= 2,
        \+ has_fact(SessionId, signal_repaired)
    ->  move_entity(SessionId, insulated_wire, main_signal),
        move_entity(SessionId, fresnel_fragment, main_signal),
        set_fact(SessionId, signal_repaired),
        set_value(SessionId, signal, 6),
        action_success(SessionId, ActorId, repair_main_signal,
            '铜线与镜片被原子地消耗并安装；主灯形成稳定归航信号。', Reply)
    ;   action_rejected(SessionId, ActorId, repair_main_signal,
            '修复需要位于聚光室、持有两件零件、港区信任至少为 2，且主灯尚未修复。', Reply)
    ).

game_action(SessionId, ActorId, recover_breath, Reply) :- !,
    ensure_mist_state(SessionId),
    add_stat(SessionId, resolve, 1, 0, 6),
    action_success(SessionId, ActorId, recover_breath,
        '你在背风处稳住三次呼吸，镇定恢复。', Reply).

game_action(SessionId, ActorId, recover_call_lin, Reply) :- !,
    ensure_mist_state(SessionId),
    add_stat(SessionId, resolve, 1, 0, 6),
    action_success(SessionId, ActorId, recover_call_lin,
        '林芮通过值班线路报出方向，镇定恢复。', Reply).

game_action(SessionId, ActorId, recover_retreat_station, Reply) :- !,
    ensure_mist_state(SessionId),
    move_entity(SessionId, ActorId, signal_station),
    add_stat(SessionId, resolve, 2, 0, 6),
    action_success(SessionId, ActorId, recover_retreat_station,
        '你沿白漆标记撤回信号站，保住已确认的事实与物品。', Reply).

game_action(SessionId, ActorId, ActionId, Reply) :-
    ensure_mist_state(SessionId),
    action_rejected(SessionId, ActorId, ActionId,
        '未知或不受支持的游戏动作。', Reply).

%% Exact effect manifests expected by the Story Session reducer.
game_rule_effects(take_storm_lantern, [
    json{type:"fact", id:"lantern-taken", value:true},
    json{type:"inventory", action:"add", item_id:"storm-lantern", count:1},
    json{type:"objective"}
]).
game_rule_effects(inspect_main_relay, [
    json{type:"fact", id:"relay-inspected", value:true},
    json{type:"fact", id:"relay-needs-wire", value:true},
    json{type:"objective"}
]).
game_rule_effects(earn_lin_trust, [
    json{type:"fact", id:"lin-key-given", value:true},
    json{type:"stat", id:"trust", delta:1},
    json{type:"inventory", action:"add", item_id:"relay-key", count:1}
]).
game_rule_effects(enter_relay_room, [
    json{type:"fact_add", id:"lantern-uses", delta:1},
    json{type:"map", node_id:"relay-room"},
    json{type:"clock_add", minutes:8}
]).
game_rule_effects(take_insulated_wire, [
    json{type:"fact", id:"wire-taken", value:true},
    json{type:"inventory", action:"add", item_id:"insulated-wire", count:1},
    json{type:"stat", id:"signal", delta:1}
]).
game_rule_effects(return_from_relay, [
    json{type:"map", node_id:"signal-station"},
    json{type:"clock_add", minutes:5}
]).
game_rule_effects(descend_lower_quay, [
    json{type:"map", node_id:"lower-quay"},
    json{type:"clock_add", minutes:12},
    json{type:"fact", id:"anya-introduced", value:true},
    json{type:"party", change:"add", character_id:"anya"},
    json{type:"stat", id:"trust", delta:1}
]).
game_rule_effects(recover_lens_fragment, [
    json{type:"fact", id:"lens-taken", value:true},
    json{type:"stat", id:"signal", delta:1},
    json{type:"inventory", action:"add", item_id:"fresnel-fragment", count:1},
    json{type:"objective"}
]).
game_rule_effects(climb_lens_loft, [
    json{type:"map", node_id:"lens-loft"},
    json{type:"clock_add", minutes:10}
]).
game_rule_effects(repair_main_signal, [
    json{type:"inventory", action:"remove", item_id:"insulated-wire", count:1},
    json{type:"inventory", action:"remove", item_id:"fresnel-fragment", count:1},
    json{type:"fact", id:"signal-repaired", value:true},
    json{type:"stat", id:"signal", delta:3},
    json{type:"objective"},
    json{type:"clock"},
    json{type:"session", ended:true}
]).
game_rule_effects(recover_breath, [json{type:"stat", id:"resolve", delta:1}]).
game_rule_effects(recover_call_lin, [json{type:"stat", id:"resolve", delta:1}]).
game_rule_effects(recover_retreat_station, [
    json{type:"map", node_id:"signal-station"},
    json{type:"stat", id:"resolve", delta:2},
    json{type:"danger", outcome:"failure"}
]).

hydrate_game_state(SessionId, ActorId, State) :-
    normalize_external_id(State.location, Location),
    util:start_session(mist_harbor_last_light, SessionId, ActorId, Location),
    ensure_mist_state(SessionId),
    hydrate_stats(SessionId, State.stats),
    hydrate_facts(SessionId, State.facts),
    hydrate_inventory(SessionId, ActorId, State.inventory),
    (   has_fact(SessionId, signal_repaired)
    ->  move_entity(SessionId, insulated_wire, main_signal),
        move_entity(SessionId, fresnel_fragment, main_signal)
    ;   true
    ).

hydrate_stats(SessionId, Stats) :-
    hydrate_stat(SessionId, Stats, resolve),
    hydrate_stat(SessionId, Stats, trust),
    hydrate_stat(SessionId, Stats, signal).

hydrate_stat(SessionId, Stats, Key) :-
    (   get_dict(Key, Stats, Value), integer(Value)
    ->  set_value(SessionId, Key, Value)
    ;   true
    ).

hydrate_facts(SessionId, Facts) :-
    dict_pairs(Facts, _, Pairs),
    maplist(hydrate_fact(SessionId), Pairs).

hydrate_fact(SessionId, ExternalKey-Value) :-
    normalize_external_id(ExternalKey, Key),
    (   Key == lantern_uses,
        integer(Value)
    ->  set_value(SessionId, lantern_uses, Value)
    ;   Value == true
    ->  set_fact(SessionId, Key)
    ;   true
    ).

hydrate_inventory(_SessionId, _ActorId, []).
hydrate_inventory(SessionId, ActorId, [Entry|Rest]) :-
    get_dict(id, Entry, ExternalId),
    get_dict(count, Entry, Count),
    normalize_external_id(ExternalId, ItemId),
    (   integer(Count), Count > 0,
        object(ItemId, _, _, _, _, _, _, _, _, _)
    ->  move_entity(SessionId, ItemId, ActorId)
    ;   true
    ),
    hydrate_inventory(SessionId, ActorId, Rest).

normalize_external_id(Value, Normalized) :-
    (   string(Value)
    ->  atom_string(Atom, Value)
    ;   Atom = Value
    ),
    atomic_list_concat(Parts, '-', Atom),
    atomic_list_concat(Parts, '_', Normalized).

game_state(SessionId, ActorId, Reply) :-
    ensure_mist_state(SessionId),
    (   util:get_entity_loc(SessionId, ActorId, Location)
    ->  true
    ;   Location = unknown
    ),
    state_value(SessionId, resolve, Resolve),
    state_value(SessionId, trust, Trust),
    state_value(SessionId, signal, Signal),
    state_value(SessionId, lantern_uses, LanternUses),
    findall(ItemId,
        (object(ItemId, _, _, _, _, _, _, _, _, _), actor_holds(SessionId, ActorId, ItemId)),
        RawInventory),
    sort(RawInventory, Inventory),
    findall(Fact, util:session_flag(SessionId, mh_fact, Fact), RawFacts),
    sort(RawFacts, Facts),
    (   member(signal_repaired, Facts)
    ->  Completed = true
    ;   Completed = false
    ),
    Reply = json{
        status: "success",
        session_id: SessionId,
        actor_id: ActorId,
        location: Location,
        stats: json{resolve: Resolve, trust: Trust, signal: Signal},
        lantern_uses: LanternUses,
        inventory: Inventory,
        facts: Facts,
        completed: Completed
    }.

ensure_mist_state(SessionId) :-
    ensure_value(SessionId, resolve, 4),
    ensure_value(SessionId, trust, 1),
    ensure_value(SessionId, signal, 1),
    ensure_value(SessionId, lantern_uses, 0).

ensure_value(SessionId, Key, Default) :-
    (   util:session_flag(SessionId, mh_value(Key), _)
    ->  true
    ;   assertz(util:session_flag(SessionId, mh_value(Key), Default))
    ).

state_value(SessionId, Key, Value) :-
    util:session_flag(SessionId, mh_value(Key), Value).

set_value(SessionId, Key, Value) :-
    retractall(util:session_flag(SessionId, mh_value(Key), _)),
    assertz(util:session_flag(SessionId, mh_value(Key), Value)).

add_stat(SessionId, Key, Delta, Min, Max) :-
    state_value(SessionId, Key, Current),
    Unclamped is Current + Delta,
    Next is max(Min, min(Max, Unclamped)),
    set_value(SessionId, Key, Next).

has_fact(SessionId, Fact) :-
    util:session_flag(SessionId, mh_fact, Fact).

set_fact(SessionId, Fact) :-
    (   has_fact(SessionId, Fact)
    ->  true
    ;   assertz(util:session_flag(SessionId, mh_fact, Fact))
    ).

actor_at(SessionId, ActorId, Location) :-
    util:get_entity_loc(SessionId, ActorId, Location).

actor_holds(SessionId, ActorId, ItemId) :-
    util:session_loc(SessionId, ItemId, ActorId).

item_at(SessionId, ItemId, Location) :-
    util:get_entity_loc(SessionId, ItemId, Location).

move_entity(SessionId, EntityId, Location) :-
    retractall(util:session_loc(SessionId, EntityId, _)),
    assertz(util:session_loc(SessionId, EntityId, Location)).

action_success(SessionId, ActorId, ActionId, Message, Reply) :-
    game_state(SessionId, ActorId, State),
    put_dict(_{
        status: "success",
        accepted: true,
        action_id: ActionId,
        message: Message
    }, State, Reply).

action_rejected(SessionId, ActorId, ActionId, Message, Reply) :-
    game_state(SessionId, ActorId, State),
    put_dict(_{
        status: "error",
        accepted: false,
        action_id: ActionId,
        message: Message
    }, State, Reply).
