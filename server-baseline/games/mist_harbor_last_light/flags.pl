:- dynamic global_flag/1.

initial_actor_room(signal_station).

direction(north).
direction(south).
direction(east).
direction(west).
direction(up).
direction(down).
direction(in).
direction(out).

room_flag(lit).
room_flag(onwater).

object_flag(visible).
object_flag(takeable).
object_flag(container).
object_flag(open).
object_flag(closed).
object_flag(locked).
object_flag(light).
object_flag(readable).
object_flag(door).
object_flag(tool).
