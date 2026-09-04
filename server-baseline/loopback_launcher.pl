:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module('../game_logic1/dynamic_server.pl').
:- use_module('alteru_extension.pl').

main :-
    http_server(http_dispatch, [port('127.0.0.1':8000)]),
    format(user_error, 'Baseline service listening on 127.0.0.1:8000~n', []),
    thread_get_message(_).
