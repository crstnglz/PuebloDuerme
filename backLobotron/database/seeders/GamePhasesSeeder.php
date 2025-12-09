<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GamePhasesSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiamos la tabla antes de insertar para evitar duplicados si se corre varias veces
        DB::table('game_phases')->truncate();

        $phases = [
            [
                'name' => 'night', 
                'duration_minutes' => 1, 
                'created_at' => now(), 
                'updated_at' => now()
            ],
            [
                'name' => 'day', 
                'duration_minutes' => 1, 
                'created_at' => now(), 
                'updated_at' => now()
            ],
        ];

        DB::table('game_phases')->insert($phases);
    }
}