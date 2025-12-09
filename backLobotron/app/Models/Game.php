<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    /** @use HasFactory<\Database\Factories\GameFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'owner_id',
        'max_players',
        'current_players',
        'status'
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function players()
    {
        return $this->belongsToMany(User::class, 'game_users')
            ->using(GameUser::class)
            ->whereNotNull('game_users.user_id') 
            ->withPivot([
                'id',
                'role_id',
                'player_status',
                'is_sheriff',
                'has_heal_potion',
                'has_kill_potion',
                'used_cupid_ability',
                'used_thief_ability'
            ])
            ->withTimestamps();
    }

    /**
     * Asigna roles básicos (Lobo y Aldeano) de forma aleatoria
     * a los jugadores de esta partida.
     *
     * @param  int  $ratio  Número de aldeanos por cada lobo
     *                      (ejemplo: 3 → 1 lobo cada 3 jugadores aprox.)
     */
    public function assignBasicRoles(int $ratio = 1): void
    {
        // Jugadores de esta partida en orden aleatorio
        $players = $this->players()->inRandomOrder()->get();
        $total   = $players->count();

        if ($total === 0) {
            return;
        }

        // Nº de lobos según el ratio
        // Ejemplo: 7 jugadores, ratio 3 → intdiv(7,3) = 2 lobos
        $wolvesCount = max(1, intdiv($total, $ratio));

        // IDs de roles "Lobo" y "Aldeano" desde la tabla roles
        $wolfRoleId = Role::where('name', 'Lobo')->value('id');
        $villagerRoleId = Role::where('name', 'Aldeano')->value('id');

        // Si por lo que sea no existen esos roles en la tabla, salimos
        if (! $wolfRoleId || ! $villagerRoleId) {
            return;
        }

        // Asignación aleatoria:
        // los primeros $wolvesCount jugadores serán lobos, el resto aldeanos
        foreach ($players as $index => $player) {
            $roleId = $index < $wolvesCount ? $wolfRoleId : $villagerRoleId;

            $this->players()->updateExistingPivot($player->id, [
                'role_id' => $roleId,
            ]);
        }
    }
}