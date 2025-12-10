<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('game_votes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('game_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('voter_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('target_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->enum('phase_type', ['day', 'night']);
            $table->unsignedInteger('turn_number')->default(1);

            $table->timestamps();

            // Un voto por fase/turno y jugador
            $table->unique(
                ['game_id', 'voter_id', 'phase_type', 'turn_number'],
                'one_vote_per_phase'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_votes');
    }
};
