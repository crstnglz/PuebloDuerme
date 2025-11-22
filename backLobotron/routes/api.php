<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);


    Route::post('/profile/uploadImage', [ProfileController::class, 'uploadImage']);

    // Datos de usuario autenticado
    Route::get('/me', function(Request $request){
            return $request->user();
        });

    Route::post('/profile/update', [ProfileController::class, 'updateProfile']);

    Route::middleware('abilities:admin')->group(function () {

         // Ruta específica para el buscador
        Route::get('/users/find', [UserController::class, 'find']);

        // CRUD
    
        // CRUD de usuarios
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
