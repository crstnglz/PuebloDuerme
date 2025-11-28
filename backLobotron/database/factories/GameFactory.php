<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Game>
 */
class GameFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Partida' . $this->faker->world(),
            'owner_id' => User::factory(),
            'max_players' => 16,
            'current_players' => $this->faker->numberBetween(1, 16),
            'status' => 'waiting'
        ];
    }
}
