<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // LISTAR usuarios (paginado
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 5);
        return response()->json(User::paginate($perPage), 200);
    }

    // Mostrar usuario por ID
    public function show($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado',
                'errors' => [
                    'id' => ['No existe un usuario con ese ID']
                ]
            ], 404);
        }

        return response()->json($user, 200);
    }

    // Crear usuario
    public function store(Request $request)
    {
        $rules = [
            'nickname' => 'required|string|max:255|unique:users',
            'email' => 'required|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string|min:8',
            'rol' => 'sometimes|in:admin,user',
        ];

        $messages = [
            'nickname.required' => 'El nombre de usuario es obligatorio.',
            'nickname.unique' => 'Ese nombre de usuario ya está en uso.',
            'email.required' => 'El email es obligatorio.',
            'email.email' => 'Debe ser un email válido.',
            'email.unique' => 'El email ya está registrado en la base de datos.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos :min caracteres.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'password_confirmation.required' => 'La confirmación de contraseña es obligatoria.',
            'rol.in' => 'El rol seleccionado no es válido.',
        ];


        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $profile_photo = 'images/usuario_predeterminado.png';

        $user = User::create([
            'nickname' => $request->nickname,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_bot' => false,
            'rol' => $request->rol ?? "user",
            'profile_photo' => $profile_photo,
        ]);

        return response()->json($user, 201);
    }

    // Actualizar usuario
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado',
                'errors' => [
                    'id' => ['No existe un usuario con ese ID']
                ]
            ], 404);
        }

        $rules = [
            'nickname' => 'sometimes|string|max:255|unique:users,nickname,' . $id,
            'email' => 'sometimes|email|max:255|unique:users,email,' . $id,
            'password' => 'sometimes|string|min:8',
            'rol' => 'sometimes|in:admin,user',
        ];

        $messages = [
            'nickname.unique' => 'Ese nombre de usuario ya está en uso.',
            'email.email' => 'El email debe ser válido.',
            'email.unique' => 'El email ya está registrado.',
            'password.min' => 'La contraseña debe tener al menos :min caracteres.',
            'rol.in' => 'El rol seleccionado no es válido.',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Errores de validación',
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($request->has('nickname'))
            $user->nickname = $request->nickname;
        if ($request->has('email'))
            $user->email = $request->email;
        if ($request->has('password'))
            $user->password = Hash::make($request->password);
        if ($request->has('rol'))
            $user->rol = $request->rol;

        $user->save();

        return response()->json($user, 200);
    }

    // Eliminar usuario
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado',
                'errors' => [
                    'id' => ['No existe un usuario con ese ID']
                ]
            ], 404);
        }

        $user->delete();
        return response()->json(null, 204);
    }

    // Actualizar contraseña
    public function updatePassword(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'new_password' => 'required|string|min:8|confirmed',
        ], [
            'new_password.required' => 'La nueva contraseña es obligatoria.',
            'new_password.min' => 'La nueva contraseña debe tener mínimo :min caracteres.',
            'new_password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Errores de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado',
                'errors' => [
                    'id' => ['No existe un usuario con ese ID']
                ]
            ], 404);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Contraseña actualizada'], 200);
    }

    // FIND con paginación
    public function find(Request $request)
    {
        $type = $request->input('type');   // id | email | nickname
        $query = $request->input('query');
        $perPage = $request->input('per_page', 5);

        if (!$type || !$query) {
            return response()->json([
                'message' => 'Error en la búsqueda',
                'errors' => [
                    'query' => ['Parámetros incompletos o inválidos']
                ]
            ], 422);
        }

        $usersQuery = User::query();

        switch ($type) {
            case 'id':
                $usersQuery->where('id', '=', intval($query));
                break;

            case 'email':
                $usersQuery->where('email', 'LIKE', "%$query%");
                break;

            case 'nickname':
                $usersQuery->where('nickname', 'LIKE', "%$query%");
                break;

            default:
                return response()->json([
                    'message' => 'Tipo de búsqueda inválido',
                    'errors' => [
                        'type' => ['El tipo debe ser id, email o nickname']
                    ]
                ], 400);
        }

        return response()->json($usersQuery->paginate($perPage), 200);
    }
}