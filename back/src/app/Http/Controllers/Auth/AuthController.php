<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $request->authenticate();

        $user = $request->user();

        $token = $user->createToken('login')->plainTextToken;

        return response(json_encode(['token' => $token]), 200)
        ->header('Content-Type', 'application/json');
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->noContent();
    }

    public function user(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'must_change_password' => $user->must_change_password,
        ]);
    }

    public function roles(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'roles' => $user->getRoleNames(),
        ]);
    }

    public function permissions(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'A senha atual está incorreta.'
            ], 422);
        }

        $user->password = $request->new_password;
        $user->must_change_password = false;
        $user->save();

        $user->tokens()->delete();

        return response()->json([
            'message' => 'Senha alterada com sucesso. Por favor, faça login novamente.'
        ], 200);
    }
}
