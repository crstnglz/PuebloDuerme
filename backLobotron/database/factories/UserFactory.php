<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    protected static ?string $password;
    public function definition(): array
    {
        return [
            
            'nickname' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'), 
            'is_bot' => false, 
            'rol' => 'user',
            
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
        ];
    }

    //para crear bots
    public function bot(): static
    {
        return $this->state(fn (array $attributes) => [
            'nickname' => 'Bot_' . fake()->userName(),
            'is_bot' => true,
            'email' => 'bot_' . fake()->unique()->safeEmail(),
            'rol' => 'user'
        ]);
    }

    public function admin(): static
    {

        return $this->state(fn (array $attributes) => [
            'rol' => 'admin',
        ]);

    }
}