<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // Listar usuarios
    public function index(Request $request)
    {
        //para que salgan 5 usuarios por página en el panel
        $perPage = $request->input('per_page', 5); 
        return response()->json(User::paginate($perPage), 200);
    }

    // Mostrar usuario por id
    public function show($id)
    {
        $user = User::findOrFail($id);

        return response()->json($user, 200);
    }


    // Crear un usuario
    public function store(Request $request)
    {
        $rules = [
            'nickname' => 'required|string|max:255|unique:users',
            'email' => 'required|email|max:255|unique:users',
            'password' => 'required|string|min:8|same:password_confirmation',
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
            'password.same' => 'La contraseña y su confirmación deben coincidir.',
            'password_confirmation.required' => 'La confirmación de contraseña es obligatoria.',
            'rol.required' => 'El rol es obligatorio.',
            'rol.in' => 'El rol seleccionado no es válido. Los roles permitidos son: admin o user.',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $profile_photo = 'images/usuario_predeterminado.png';

        $user = User::create([
            'nickname' => $request->nickname,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_bot' => false,
            'rol' => $request->rol,
            'profile_photo' => $profile_photo,
        ]);

        return response()->json($user, 201);
    }

    // Actualizar usuario
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $rules = [
            'nickname' => 'sometimes|string|max:255|unique:users,nickname,' . $id,
            'email' => 'sometimes|email|max:255|unique:users,email,' . $id,
            'password' => 'sometimes|string|min:8', 
            'rol' => 'sometimes|in:admin,user',
        ];

        $messages = [
            'nickname.string' => 'El nombre de usuario debe ser una cadena de texto.',
            'nickname.max' => 'El nombre de usuario no puede exceder los :max caracteres.',
            'nickname.unique' => 'Ese nombre de usuario ya está en uso por otro usuario.',
            'email.email' => 'El email debe ser una dirección de correo electrónico válida.',
            'email.max' => 'El email no puede exceder los :max caracteres.',
            'email.unique' => 'El email ya está registrado por otro usuario.',
            'password.string' => 'La contraseña debe ser una cadena de texto.',
            'password.min' => 'La contraseña debe tener al menos :min caracteres.',
            'rol.in' => 'El rol seleccionado no es válido. Los roles permitidos son: admin o user.',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        if ($request->has('nickname')) {
            $user->nickname = $request->nickname;
        }

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->has('password')) {
            $user->password = Hash::make($request->password);
        }

        if ($request->has('rol')) {
            $user->rol = $request->rol;
        }

        $user->save();

        return response()->json($user, 200);
    }


    // Eliminar usuario
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(null, 204);
    }

    // Actualizar contraseña usuario
    public function updatePassword(Request $request, $id)
    {

        $rules = [

            'new_password' => 'required|string|min:8|confirmed',
        ];

        $messages = [
            'new_password.required' => 'La nueva contraseña es obligatoria.',
            'new_password.string' => 'La nueva contraseña debe ser una cadena de texto.',
            'new_password.min' => 'La nueva contraseña debe tener al menos :min caracteres.',
            'new_password.confirmed' => 'La nueva contraseña y su confirmación deben coincidir.',
        ];


        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {

            return response()->json($validator->errors(), 422);
        }

        $user = User::findOrFail($id);


        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Contraseña del usuario actualizada por el administrador'], 200);
    }

    // Para buscar usuario por id, nickname o email
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