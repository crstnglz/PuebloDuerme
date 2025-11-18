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

    public function login(Request $request)
    {
        $rules = [
            'identifier' => 'required|string',
            'password' => 'required|string|min:8',
        ];

        $messages = [
            'identifier.required' => 'El email o usuario es obligatorio.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos :min caracteres.'
        ];

        // Validación
        $validator = Validator::make($request->all(), $rules, $messages);
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $identifier = $request->identifier;

        // Determinar si es email o nickname
        $field = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'nickname';

        // Buscar usuario
        $user = User::where($field, $identifier)->first();

        // Verificar usuario y contraseña
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        // Crear token (usando Sanctum como en el registro)
        $token = $user->createToken('auth_token')->plainTextToken;

        // Respuesta exitosa 
        return response()->json([
            'message' => 'Login exitoso',
            'data' => [
                'token' => $token,
                'id' => $user->id,
                'nickname' => $user->nickname,
                'rol' => $user->rol,
                'abilities' => [],
                'profile_photo' => $user->profile_photo,
            ]
        ], 200);
    }

    public function register(Request $request)
{
    $rules = [
        'nickname' => 'required|string|max:255|unique:users',
        'email' => 'required|email|max:255|unique:users',
        'password' => 'required|string|min:8|same:password_confirmation',
        'password_confirmation' => 'required|string|min:8',
    ];

    $messages = [
        'nickname.required' => 'El nombre de usuario es obligatorio.',
        'nickname.unique' => 'Ese nombre de usuario ya está en uso.',
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

    // Llamar login automáticamente usando identifier
    $loginRequest = new Request([
        'identifier' => $request->email, // o nickname si prefieres
        'password' => $request->password
    ]);

    return $this->login($loginRequest);
}
}
