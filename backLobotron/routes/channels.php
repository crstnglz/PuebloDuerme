<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Game;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('game.{gameId}', function ($user, $gameId) {
    if(!$user) return false;

    $game = Game::find($gameId);
    if(!$game) return false;

    $isInGame = $game->players()->where('user_id', $user->id)->exists();
    if (!$isInGame) return false;

    return [
        'id' => $user->id,
        'nickname' => $user->nickname,
        'profile_photo' => $user->profile_photo
    ];
});

