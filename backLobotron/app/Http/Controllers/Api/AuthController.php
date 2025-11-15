<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

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
            'password.same' => 'La contraseña y su confirmación deben coincidir.',
            'password_confirmation.required' => 'La confirmación de contraseña es obligatoria.',
        ];

        // Validación
        $validator = Validator::make($request->all(), $rules, $messages);
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Imagen predeterminada
        $profile_photo = 'images/usuario_predeterminado.png';

        // Crear usuario
        $user = User::create([
            'nickname' => $request->nickname,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_bot' => false,
            'rol' => 'user',
            'profile_photo' => $profile_photo,
        ]);

        // LLamo automaticamente al login para iniciar sesion nada mas registrarme
        $loginRequest = new Request([
            'email' => $request->email,
            'password' => $request->password
        ]);

        return $this->login($loginRequest);
    }

    public function login(Request $request)
{
    $rules = [
        'email' => 'required|email',
        'password' => 'required|string',
    ];

    $validator = Validator::make($request->all(), $rules);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 422);
    }

    // Buscar usuario
    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json([
            'message' => 'Credenciales inválidas',
        ], 401);
    }

    // Definir abilities según el rol
    $abilities = match ($user->rol) {
        'admin' => ['admin:all', 'user:basic'],
        'user'  => ['user:basic'],
        default => ['user:basic'],
    };

    // Crear token con abilities
    $token = $user->createToken('auth_token', $abilities)->plainTextToken;

    return response()->json([
        "success" => true,
        "message" => "Login exitoso",
        "data" => [
            "id" => $user->id,
            "nickname" => $user->nickname,
            "email" => $user->email,
            "rol" => $user->rol,
            "token" => $token,
        ]
    ]);
}


}