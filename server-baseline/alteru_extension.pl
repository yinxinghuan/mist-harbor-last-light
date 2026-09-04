:- module(alteru_extension, [assert_configuration/0]).

:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_parameters)).
:- use_module(library(error)).

:- http_handler(root(game/action), handle_game_action, [method(post)]).
:- http_handler(root(game/state), handle_game_state, [method(get)]).
:- http_handler(root(v1/resolve), handle_rule_resolve, [method(post)]).
:- http_handler(root(health), handle_health, [method(get)]).

handle_health(_Request) :-
    reply_json_dict(json{status: "ok", service: "alteru-prolog-experiment"}).

assert_configuration :-
    required_env('RULE_SERVICE_TOKEN', _).

handle_game_action(Request) :-
    http_read_json_dict(Request, Dict),
    atom_value(Dict.session_id, SessionId),
    atom_value(Dict.actor_id, ActorId),
    atom_value(Dict.action_id, ActionId),
    (   util:session_info(SessionId, GameId, _)
    ->  (   current_predicate(GameId:game_action/4)
        ->  session_mutex(SessionId, Mutex),
            normalize_id(ActionId, NormalizedActionId),
            with_mutex(Mutex, GameId:game_action(SessionId, ActorId, NormalizedActionId, RawReply)),
            put_dict(action_id, RawReply, ActionId, Reply),
            reply_json_dict(Reply)
        ;   reply_json_dict(json{
                status: "error",
                accepted: false,
                code: "game_action_not_supported",
                message: "This game does not define game_action/4."
            }, [status(404)])
        )
    ;   reply_json_dict(json{
            status: "error",
            accepted: false,
            code: "session_not_found",
            message: "Session not found."
        }, [status(404)])
    ).

handle_rule_resolve(Request) :-
    (   authorized(Request)
    ->  true
    ;   throw(http_reply(forbidden('A valid internal service credential is required.')))
    ),
    enforce_body_limit(Request),
    http_read_json_dict(Request, Dict),
    atom_value(Dict.request_id, RequestId),
    atom_value(Dict.game_id, ExternalGameId),
    atom_value(Dict.session_id, SessionId),
    atom_value(Dict.actor_id, ActorId),
    atom_value(Dict.action_id, ExternalActionId),
    RulesetVersion = Dict.ruleset_version,
    State = Dict.state,
    normalize_id(ExternalGameId, GameId),
    normalize_id(ExternalActionId, ActionId),
    session_mutex(SessionId, Mutex),
    with_mutex(Mutex,
        resolve_rule_locked(GameId, SessionId, ActorId, ActionId, State,
            Status, Effects, Reasons, NextActionIds)),
    reply_json_dict(json{
        ok: true,
        request_id: RequestId,
        game_id: ExternalGameId,
        ruleset_version: RulesetVersion,
        result: json{
            status: Status,
            rule_id: ExternalActionId,
            reasons: Reasons,
            effects: Effects,
            next_action_ids: NextActionIds
        }
    }).

resolve_rule_locked(GameId, SessionId, ActorId, ActionId, State,
        Status, Effects, Reasons, NextActionIds) :-
    ensure_game_loaded(GameId),
    (   current_predicate(GameId:hydrate_game_state/3),
        current_predicate(GameId:game_action/4),
        current_predicate(GameId:game_rule_effects/2)
    ->  GameId:hydrate_game_state(SessionId, ActorId, State),
        GameId:game_action(SessionId, ActorId, ActionId, Reply),
        (   Reply.accepted == true
        ->  Status = "accepted",
            GameId:game_rule_effects(ActionId, Effects),
            Reasons = []
        ;   Status = "rejected",
            Effects = [],
            Reasons = ["precondition_failed"]
        ),
        NextActionIds = []
    ;   Status = "rejected",
        Effects = [],
        Reasons = ["game_rule_contract_missing"],
        NextActionIds = []
    ).

ensure_game_loaded(GameId) :-
    (   current_predicate(GameId:game_action/4)
    ->  true
    ;   with_mutex(alteru_game_load, util:load_game_data(GameId))
    ).

handle_game_state(Request) :-
    http_parameters(Request, [
        session_id(SessionId, [atom]),
        actor_id(ActorId, [atom])
    ]),
    (   util:session_info(SessionId, GameId, _)
    ->  (   current_predicate(GameId:game_state/3)
        ->  session_mutex(SessionId, Mutex),
            with_mutex(Mutex, GameId:game_state(SessionId, ActorId, Reply)),
            reply_json_dict(Reply)
        ;   reply_json_dict(json{
                status: "error",
                code: "game_state_not_supported",
                message: "This game does not define game_state/3."
            }, [status(404)])
        )
    ;   reply_json_dict(json{
            status: "error",
            code: "session_not_found",
            message: "Session not found."
        }, [status(404)])
    ).

atom_value(Value, Atom) :-
    (   atom(Value)
    ->  Atom = Value
    ;   string(Value)
    ->  atom_string(Atom, Value)
    ).

session_mutex(SessionId, Mutex) :-
    atomic_list_concat(['alteru_game_', SessionId], Mutex).

normalize_id(Value, Normalized) :-
    atomic_list_concat(Parts, '-', Value),
    atomic_list_concat(Parts, '_', Normalized).

authorized(Request) :-
    required_env('RULE_SERVICE_TOKEN', Token),
    memberchk(authorization(Header), Request),
    atom_concat('Bearer ', Token, Expected),
    Header == Expected.

enforce_body_limit(Request) :-
    Max = 65536,
    (   memberchk(content_length(Length), Request)
    ->  must_be(integer, Length),
        ( Length =< Max -> true ; throw(error(request_too_large, _)) )
    ;   true
    ).

required_env(Name, Value) :-
    getenv(Name, Raw),
    Raw \== '',
    ( atom(Raw) -> Value = Raw ; string(Raw) -> atom_string(Value, Raw) ).
