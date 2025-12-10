<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Game;
use PHPUnit\Logging\JUnit\TestRunnerExecutionFinishedSubscriber;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('game.{gameId}', function ($user,$gameId) {
    return true;
});

Broadcast::channel('lobby', function ($user)
{
    return true;
});

Broadcast::channel('wolves.{gameId}', function($user, $gameId)
{
    $game = Game::find($gameId);
    if (!$game) return false;

    $player = $game->players()->where('user_id', $user->id)->first();
    if(!$player) return false;

    return $player->role && $player->role->name === 'lobo';
});
