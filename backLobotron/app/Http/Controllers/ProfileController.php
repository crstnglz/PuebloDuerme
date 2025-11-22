<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    public function uploadImage(Request $request)
    {
        //Validación de archivo
        $messages = [
            'image.required' => 'Falta el archivo',
            'image.mimes' => 'Tipo no soportado',
            'image.max' => 'El archivo excede el tamaño máximo permitido',
        ];

        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB
        ], $messages);

        if ($validator->fails()) {
        return response()->json($validator->errors(), 422);
        }


        if($request->hasFile('image') && $request->file('image')->isValid())
        {
            try
            {
                $file = $request->file('image');
                //Generamos nombre único para imagen
                //Obtenemos nombre y extensión por separado
                $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

                $extension = $file->getClientOriginalExtension();

                //Generamos nombre único y seguro
                $filename = uniqid('img_') . '_' . Str::slug($originalName) . '.' . $extension;

                //Subimos archivo usando cloudinary
                $uploadedFilePath = Storage::disk('cloudinary')->putFileAs('laravel', $file, $filename);

                //Obtenemos URL pública
                $url = Storage::disk('cloudinary')->url($uploadedFilePath);

                return response()->json(['url' => $url], 200);
            } catch(\Exception $e)
            {
                return response()->json(['error' => 'Error al subir la imagen: ' . $e->getMessage()], 500);
            }
        }
        return response()->json(['error' => 'No se recibió ningún archivo.'], 400);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'nickname' => 'nullable|string|max:255|unique:users,nickname,' . $user->id,
            'description' => 'nullable|string|max:500',
            'profile_photo' => 'nullable|url', // permite null
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        if ($request->filled('nickname')) {
            $user->nickname = $request->nickname;
        }

        if ($request->has('description')) {
            $user->description = $request->description; // puede ser null o string vacía
        }

        if ($request->filled('profile_photo')) {
            $user->profile_photo = $request->profile_photo;
        }

        $user->save();

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'user' => $user
        ], 200);
    }
}
