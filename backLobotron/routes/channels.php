<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('game.{gameId}', function ($user, $gameId) {
    if(!$user) return false;

    return [
        'id' => $user->id,
        'nickname' => $user->nickname,
        'profile_photo' => $user->profile_photo
    ];
});

