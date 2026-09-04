:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module('../game_logic1/dynamic_server.pl').
:- use_module('alteru_extension.pl').

production_hidden_handler(root(load_game)).
production_hidden_handler(root(query)).
production_hidden_handler(root(path)).
production_hidden_handler(root(room)).
production_hidden_handler(root(actor/room)).
production_hidden_handler(root(actor/others)).
production_hidden_handler(root(exits)).
production_hidden_handler(root(read)).
production_hidden_handler(root(sessions)).
production_hidden_handler(root(dialogue)).
production_hidden_handler(root(join)).
production_hidden_handler(root(consult)).
production_hidden_handler(root(session/start)).
production_hidden_handler(root(move)).
production_hidden_handler(root(take)).
production_hidden_handler(root(drop)).
production_hidden_handler(root(open)).
production_hidden_handler(root(close)).
production_hidden_handler(root(speak)).
production_hidden_handler(root(game/action)).
production_hidden_handler(root(game/state)).

remove_production_hidden_handlers :-
    forall(
        production_hidden_handler(Path),
        catch(http_delete_handler(Path), _, true)
    ).

main :-
    alteru_extension:assert_configuration,
    remove_production_hidden_handlers,
    env_atom('RULE_SERVICE_BIND', '0.0.0.0', Bind),
    env_integer('RULE_SERVICE_PORT', 8000, Port),
    http_server(http_dispatch, [ip(Bind), port(Port)]),
    format(user_error, 'Production rule service listening on ~w:~d~n', [Bind, Port]),
    thread_get_message(_).

env_atom(Name, Default, Value) :-
    ( env_value(Name, Value) -> true ; Value = Default ).

env_integer(Name, Default, Value) :-
    (   env_value(Name, Raw)
    ->  atom_number(Raw, Number),
        must_be(integer, Number),
        Value = Number
    ;   Value = Default
    ).

env_value(Name, Value) :-
    getenv(Name, Raw),
    Raw \== '',
    ( atom(Raw) -> Value = Raw ; string(Raw) -> atom_string(Value, Raw) ).
