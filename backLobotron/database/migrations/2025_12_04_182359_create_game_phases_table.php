<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_phases', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // 'Day', 'Night'
            $table->unsignedSmallInteger('duration_minutes')->default(1); // Duración estándar
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_phases');
    }
};