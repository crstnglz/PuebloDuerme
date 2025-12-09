<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Game;
use PHPUnit\Logging\JUnit\TestRunnerExecutionFinishedSubscriber;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('game.{gameId}', function () {
    return true;
});

Broadcast::channel('lobby', function ($user)
{
    return true;
});

