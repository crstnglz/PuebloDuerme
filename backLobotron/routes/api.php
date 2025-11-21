<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;


Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/profile/uploadImage', [ProfileController::class, 'uploadImage']);


Route::middleware('auth:sanctum')->group(function () {

     // Datos de usuario autenticado
        Route::get('/me', function(Request $request){
            return $request->user();
        });

        Route::post('/profile/update', [ProfileController::class, 'updateProfile']);

    Route::middleware('abilities:admin')->group(function () {

        // CRUD de usuarios
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::patch('/users/{id}/password', [UserController::class, 'updatePassword']);
    });


});

