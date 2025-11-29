<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Canal de la partida
Broadcast::channel('games.{gameId}', function ($user, $gameId) {

    return !is_null($user);
});