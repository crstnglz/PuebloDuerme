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

        
    
        $abilities = ['read']; // Habilidad base para cualquier usuario
        
        if ($user->rol === 'admin') {
            
            $abilities[] = 'admin'; 
        }

        // Crear token usando Sanctum
        $tokenResult = $user->createToken('auth_token', $abilities);
        $token = $tokenResult->plainTextToken;

        // Respuesta exitosa 
        return response()->json([
            'message' => 'Login exitoso',
            'data' => [
                'access_token' => $token,
                'id' => $user->id,
                'nickname' => $user->nickname,
                'rol' => $user->rol,
                'abilities' => $abilities, // Devuelve las abilities asignadas
                'profile_photo' => $user->profile_photo,
            ]
        ], 200);
    }

    public function register(Request $request)
{
    // --- VALIDACIÓN ---
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

    $validator = Validator::make($request->all(), $rules, $messages);
    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    // --- FOTO POR DEFECTO ---
    $profile_photo = 'images/usuario_predeterminado.png';

    // --- CREAR USUARIO ---
    $user = User::create([
        'nickname' => $request->nickname,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'is_bot' => false,
        'rol' => 'user',
        'profile_photo' => $profile_photo,
    ]);

    // --- HABILIDADES ---
    $abilities = ['read'];
    if ($user->rol === 'admin') {
        $abilities[] = 'admin';
    }

    // --- CREAR TOKEN ---
    $tokenResult = $user->createToken('auth_token', $abilities);
    $token = $tokenResult->plainTextToken;

    // --- RESPUESTA IGUAL QUE LOGIN ---
    return response()->json([
        'message' => 'Registro + login exitoso',
        'data' => [
            'access_token' => $token,
            'id' => $user->id,
            'nickname' => $user->nickname,
            'rol' => $user->rol,
            'abilities' => $abilities,
            'profile_photo' => $user->profile_photo,
        ]
    ], 201);
}


    public function logout(Request $request)
    {
        // Elimina solo el token actual (seguro y recomendado)
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout exitoso'
        ]);
    }
}
