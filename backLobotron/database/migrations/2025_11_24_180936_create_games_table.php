<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table-> foreignId('owner_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->integer('max_players')->default(30);
            $table->integer('current_players')->default(1);
            $table->enum('status', ['esperando', 'en curso', 'finalizada'])->default('esperando');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
