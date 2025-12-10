<?php

namespace App\Http\Controllers;

use App\Events\PhaseTransition;
use App\Events\PlayerJoined;
use App\Models\Game;
use App\Events\GameStarted;
use App\Events\GameCreated;
use App\Events\GameUpdated;
use App\Events\GameDeleted;
use App\Models\GamePhase;
use App\Models\GameUser;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;

class GameController extends Controller
{
    // Listar todas las partidas disponibles
    public function index()
    {
        try {
            $games = Game::with('owner:id,nickname')->get();
            return response()->json(['success' => true, 'data' => ['games' => $games]], 200);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error cargando las partidas'], 500);
        }
    }

    // Crear una nueva partida
    public function store(Request $request)
    {
        $user = $request->user();

        // Validar nombre de la partida
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()], 422);
        }

        // Comprobar si el nombre de la partida ya existe
        if (Game::where('name', $request->name)->exists()) {
            return response()->json(['success' => false, 'message' => 'El nombre de la partida ya está en uso'], 409);
        }

        try {
            // Buscar el rol por defecto (aldeano)
            $defaultRole = Role::where('name', 'aldeano')->first();

            // Crear la partida
            $game = Game::create([
                'name' => $request->name,
                'owner_id' => $user->id,
                'max_players' => 16,
                'current_players' => 1,
                'status' => 'esperando'
            ]);

            // Agregar al creador como primer jugador
            GameUser::create([
                'game_id' => $game->id,
                'user_id' => $user->id,
                'role_id' => $defaultRole->id,
                'player_status' => 'alive'
            ]);

            // Cargar los datos del dueño para el frontend
            $game->load('owner:id,nickname');

            broadcast(new GameCreated($game));

            return response()->json([
                'success' => true,
                'message' => 'Partida creada correctamente',
                'data' => ['game' => $game]
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error creando la partida: ' . $e->getMessage()], 500);
        }
    }

    // Unirse a una partida existente
    public function join(Request $request, Game $game)
    {
        $user = $request->user();

        try {
            // Comprobar si la partida está llena
            if ($game->current_players >= $game->max_players) {
                return response()->json(['success' => false, 'message' => 'La partida está llena'], 403);
            }

            // Comprobar si el usuario ya está unido
            $alreadyJoined = GameUser::where('game_id', $game->id)
                ->where('user_id', $user->id)
                ->exists();

            if (!$alreadyJoined) {
                $villagerRole = Role::where('name', 'aldeano')->first();

                // Agregar usuario a la partida
                GameUser::create([
                    'game_id' => $game->id,
                    'user_id' => $user->id,
                    'role_id' => $villagerRole->id,
                    'player_status' => 'alive'
                ]);

                // Incrementar contador de jugadores
                $game->increment('current_players');


                try {
                    event(new PlayerJoined($game, $user));
                } catch (Exception $e) {
                }
            }

            $game->load('owner:id,nickname', 'players');


            return response()->json([
                'success' => true,
                'message' => 'Te has unido correctamente',
                'data' => ['game' => $game]
            ], 200);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al unirse a la partida: ' . $e->getMessage()], 500);
        }
    }

    // Mostrar detalles de la partida (Sala)
    public function show($id)
    {
        try {
            // Buscar partida y cargar jugadores
            $game = Game::with('players')->findOrFail($id);

            return response()->json(['success' => true, 'data' => ['game' => $game]], 200);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Partida no encontrada o error interno'], 404);
        }
    }

    // Actualizar datos de la partida
    public function update(Request $request, Game $game)
    {
        // Solo el dueño o un admin pueden actualizar
        if ($request->user()->id !== $game->owner_id && $request->user()->rol !== 'admin') {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $game->update($request->all());
        $game->load('owner:id,nickname');

        broadcast(new GameUpdated($game));

        return response()->json(['success' => true, 'data' => ['game' => $game]], 200);
    }

    // Eliminar partida
    public function destroy(Request $request, Game $game)
    {
        if ($request->user()->id !== $game->owner_id && $request->user()->rol !== 'admin') {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $id = $game->id;
        $game->delete();

        broadcast(new GameDeleted($id));

        return response()->json(['success' => true, 'message' => 'Partida eliminada'], 200);
    }

    public function leave(Request $request, Game $game)
    {
        $user = $request->user();

        if (! $game->players()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'No estás en esta partida', 400]);
        }

        if ($user->id === $game->owner_id) {
            broadcast(new \App\Events\GameForceExit($game->id, "owner_left"))->toOthers();
            broadcast(new GameDeleted($game->id))->toOthers();

            $game->delete();

            return response()->json([
                'success' => true,
                'status' => 'deleted',
                'reason' => 'owner_left'
            ]);
        }

        $game->players()->detach($user->id);

        if ($game->current_players > 0) {
            $game->decrement('current_players');
        }

        $game->refresh();

        $remainingPlayers = $game->current_players;

        if ($remainingPlayers === 0) {
            broadcast(new GameDeleted($game->id))->toOthers();

            $game->delete();

            return response()->json([
                'success' => true,
                'status' => 'deleted',
                'reason' => 'game_empty'
            ]);
        }

        broadcast(new \App\Events\PlayerLeftGame(
            $game->id,
            $user->id,
            $user->nickname,
            $remainingPlayers
        ));

        return response()->json([
            'success' => true,
            'status' => 'left',
            'game_id' => $game->id
        ]);
    }

    public function start(Game $game)
    {

        if (auth()->id() !== $game->owner_id) {
            return response()->json(['error' => 'Solo el creador de la partida puede iniciarla.'], 403);
        }

        // 1) Asignar roles básicos (Lobo / Aldeano)
        //    Ajusta el ratio a lo que quieras: 3 = aprox. 1 lobo cada 3 jugadores
        $game->assignBasicRoles(3);

        $game->status = 'en curso';

        $dayPhase = GamePhase::firstWhere('name', 'day');

        if (! $dayPhase) {
            return response()->json(['error' => 'Fase "day" no configurada'], 500);
        }

        $game->current_phase_id = $dayPhase->id;
        $game->phase_ends_at = now()->addMinutes($dayPhase->duration_minutes ?? 1);

        $game->save();

        // 3) Emitir evento "la partida ha empezado"
        event(new GameStarted($game->id));

        event(new PhaseTransition(
            $game->id,
            $dayPhase->name,
            $game->phase_ends_at->toIso8601String()
        ));

        event(new GameStarted(
            $game->id,
            $dayPhase->name,
            $game->phase_ends_at->toIso8601String()
        ));

        return response()->json([
            'message' => 'Partida iniciada',
            'game_id' => $game->id,
            'data' => [
                'turn_state' => $dayPhase->name,
                'end_time' => $game->phase_ends_at->toIso8601String()
            ]
        ]);
    }

    public function meRole(Request $request, Game $game)
    {
        $user = $request->user(); // usuario autenticado

        // Buscamos al jugador en esta partida
        $player = $game->players()
            ->where('users.id', $user->id)
            ->first();

        // Si no está en la partida o aún no tiene rol asignado
        if (! $player || ! $player->pivot->role_id) {
            return response()->json([
                'role_name'      => null,
                'role_team'      => null,
                'role_slug'      => null,
                'visible_wolves' => [],
            ], 200);
        }

        $role = Role::find($player->pivot->role_id);

        // Por defecto, ningún lobo visible
        $visibleWolves = [];

        // Si YO soy lobo, quiero ver a TODOS los lobos de la partida
        if ($role && strtolower($role->name) === 'lobo') {
            $wolfRole = Role::where('name', 'lobo')->first();

            if ($wolfRole) {
                $visibleWolves = $game->players()
                    ->wherePivot('role_id', $wolfRole->id)
                    ->pluck('users.id')   // ids de los usuarios-lobo
                    ->values()
                    ->all();
            }
        }

        return response()->json([
            'role_name'      => $role?->name,                 // "Lobo"
            'role_team'      => $role?->team,                 // "lobos"
            'role_slug'      => $role ? strtolower($role->name) : null, // "lobo"
            'visible_wolves' => $visibleWolves,               // [id_admin, id_otro_lobo, ...]
        ], 200);
    }
}
