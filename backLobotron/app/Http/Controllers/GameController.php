<?php

namespace App\Http\Controllers;

use App\Events\PlayerJoined;
use App\Models\Game;
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

        return response()->json(['success' => true, 'data' => ['game' => $game]], 200);
    }

    // Eliminar partida
    public function destroy(Request $request, Game $game)
    {
        if ($request->user()->id !== $game->owner_id && $request->user()->rol !== 'admin') {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $game->delete();

        return response()->json(['success' => true, 'message' => 'Partida eliminada'], 200);
    }
}