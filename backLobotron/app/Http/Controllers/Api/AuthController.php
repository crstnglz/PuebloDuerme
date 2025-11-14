<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        
        $rules = [
            'nickname' => 'required|string|max:255|unique:users',
            'email' => 'required|email|max:255|unique:users',
            
            'password' => 'required|string|min:8|same:password_confirmation',
            
            'password_confirmation' => 'required|string|min:8',
        ];

        $messages = [
            'nickname.required' => 'El nickname es obligatorio.',
            'nickname.unique' => 'Ese nickname ya está en uso.',
            'email.required' => 'El email es obligatorio.',
            'email.email' => 'Debe ser un email válido.',
            'email.unique' => 'El email ya está registrado en la base de datos.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos :min caracteres.',
            'password.same' => 'El campo :attribute y :other deben coincidir.',
            'password_confirmation.required' => 'La confirmación de contraseña es obligatoria.',
        ];

        // Ejecuta Validación
        $validator = Validator::make($request->all(), $rules, $messages);
        if ($validator->fails()) {
            // Si falla, devuelve los errores
            return response()->json($validator->errors(), 422);
        }

        $profile_photo = 'images/usuario_predeterminado.png';

        //Crear el Usuario
        $user = User::create([
            'nickname' => $request->nickname,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_bot' => false,
            // Asignamos el rol por defecto como user
            'rol' => 'user', 
            'profile_photo' => $profile_photo,
        ]);

        // Se crea el token (Esto es como un Auto-Login)
        $tokenResult = $user->createToken('auth_token');

        $success = [
            'id' => $user->id,
            'nickname' => $user->nickname,
            'rol' => $user->rol,
            'token' => $tokenResult->plainTextToken,
            'profile_photo' => $user->profile_photo
        ];

        // Se envia la respuesta
        return response()->json([
            "success" => true, 
            "data" => $success, 
            "message" => "¡Usuario registrado. Se ha iniciado sesión!"
        ], 201); 
    }
}