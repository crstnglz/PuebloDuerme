<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/profile/uploadImage', [ProfileController::class, 'uploadImage']);

Route::middleware('auth:sanctum')->group(function () {

    Route::middleware('abilities:admin')->group(function () {

        // Ruta específica para el buscador
        Route::get('/users/find', [UserController::class, 'find']);

        // CRUD
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);

        Route::get('/users/{id}', [UserController::class, 'show'])
            ->where('id', '[0-9]+');

        Route::put('/users/{id}', [UserController::class, 'update'])
            ->where('id', '[0-9]+');

        Route::delete('/users/{id}', [UserController::class, 'destroy'])
            ->where('id', '[0-9]+');

        Route::patch('/users/{id}/password', [UserController::class, 'updatePassword'])
            ->where('id', '[0-9]+');

        Route::patch('/users/{id}/role', [UserController::class, 'updateRole'])
            ->where('id', '[0-9]+');
    });
});
