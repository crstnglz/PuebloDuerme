<?php

namespace App\Http\Controllers;

use App\Events\PhaseTransition;
use App\Models\Game;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\GamePhase;

class PhaseTransitionController extends Controller
{

    public function changePhase(Request $request, Game $game)
    {
        // Fases
        $dayPhase = GamePhase::where('name', 'day')->first();
        $nightPhase = GamePhase::where('name', 'night')->first();

        if (!$dayPhase || !$nightPhase) {
            return response()->json(['error' => 'Fases no configuradas'], 500);
        }

        // Guardamos la fase anterior antes de cambiarla
        $oldPhaseId = $game->current_phase_id;

        // Alternamos día/noche
        $game->current_phase_id = ($oldPhaseId === $dayPhase->id)
            ? $nightPhase->id
            : $dayPhase->id;

        // Actualizamos fin de fase
        $game->phase_ends_at = now()->addMinutes(
            $game->currentPhase->duration_minutes ?? 1
        );

        // Incrementamo un turno solo si pasa de noche → día (un turno = dia + noche)
        if ($oldPhaseId === $nightPhase->id && $game->current_phase_id === $dayPhase->id) {
            $game->turn_number += 1;
        }

        $game->save();

        event(new PhaseTransition(
            $game->id,
            $game->currentPhase->name,
            $game->phase_ends_at->toIso8601String()
        ));

        return response()->json([
            'success' => true,
            'data' => [
                'turn_state' => $game->currentPhase->name,
                'end_time' => $game->phase_ends_at->toIso8601String(),
                'turn_number' => $game->turn_number // lo devuelvo por si en un futuro nos interes que salga el numero de la ronda
            ]
        ]);
    }
}