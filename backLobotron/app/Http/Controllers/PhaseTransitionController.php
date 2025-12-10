<?php

namespace App\Http\Controllers;

use App\Events\PhaseTransition;
use App\Events\PlayerKilled;
use App\Models\Game;
use Illuminate\Http\Request;
use App\Models\GamePhase;
use App\Models\GameVote;   // 👈 asegúrate de tener este modelo
use App\Models\GameUser;   // 👈 y este

class PhaseTransitionController extends Controller
{
    public function changePhase(Request $request, Game $game)
    {

        $dayPhase = GamePhase::where('name', 'day')->first();
        $nightPhase = GamePhase::where('name', 'night')->first();

        if (! $dayPhase || ! $nightPhase) {
            return response()->json(['error' => 'Fases no configuradas'], 500);
        }

       
        $oldPhaseId = $game->current_phase_id;

       
        $oldPhaseName = null;
        if ($oldPhaseId === $dayPhase->id) {
            $oldPhaseName = 'day';
        } elseif ($oldPhaseId === $nightPhase->id) {
            $oldPhaseName = 'night';
        }

       
        if ($oldPhaseId === $dayPhase->id) {
            $newPhaseModel = $nightPhase;
        } else {
            
            $newPhaseModel = $dayPhase;
        }

        $newPhaseName = strtolower($newPhaseModel->name);

        
        if ($oldPhaseName === 'night' && $newPhaseName === 'day') {
            $this->resolveVotesForPhase($game, 'night', 1);
        }

        if ($oldPhaseName === 'day' && $newPhaseName === 'night') {
            $this->resolveVotesForPhase($game, 'day', 1);
        }

        $game->current_phase_id = $newPhaseModel->id;

        $game->phase_ends_at = now()->addMinutes(
            $newPhaseModel->duration_minutes ?? 1
        );

        if ($oldPhaseName === 'night' && $newPhaseName === 'day') {
            $game->turn_number += 1;
        }

        $game->save();

        event(new PhaseTransition(
            $game->id,
            $newPhaseModel->name,
            $game->phase_ends_at->toIso8601String()
        ));

        return response()->json([
            'success' => true,
            'data' => [
                'turn_state'  => $newPhaseModel->name,
                'end_time'    => $game->phase_ends_at->toIso8601String(),
                'turn_number' => $game->turn_number,
            ]
        ]);
    }

   private function resolveVotesForPhase(Game $game, string $phase, int $minVotes = 1): void
{
    $votes = GameVote::where('game_id', $game->id)
        ->where('phase', $phase)
        ->get();

    if ($votes->isEmpty()) {
        return;
    }

    // Agrupar por target_id
    $grouped = $votes->groupBy('target_id');

    $maxCount   = 0;
    $candidates = [];

    foreach ($grouped as $targetId => $list) {
        $count = $list->count();

        if ($count > $maxCount) {
            $maxCount   = $count;
            $candidates = [$targetId];
        } elseif ($count === $maxCount) {
            $candidates[] = $targetId; // empate
        }
    }

    // No llegan al mínimo de votos
    if ($maxCount < $minVotes || empty($candidates)) {
        return;
    }

    // Empate → de momento no matamos a nadie (si quieres podemos cambiar esto)
    if (count($candidates) > 1) {
        return;
    }

    $targetId = $candidates[0];

    // Buscar al jugador en la tabla pivote
    $pivot = GameUser::where('game_id', $game->id)
        ->where('user_id', $targetId)
        ->first();

    if (! $pivot) {
        return;
    }

    // Marcar como muerto
    $pivot->player_status = 'dead';
    $pivot->save();

    // Obtener su rol para revelar al front
    $pivot->load('role'); // 👈 asegúrate de que GameUser tenga relación role()

    $roleName = $pivot->role?->name;
    $roleTeam = $pivot->role?->team;

    // Limpiar los votos de esa fase
    GameVote::where('game_id', $game->id)
        ->where('phase', $phase)
        ->delete();

    // Lanzar evento para el front
    event(new PlayerKilled(
        $game->id,
        $targetId,
        $phase,
        $roleName,
        $roleTeam
    ));
}
}
