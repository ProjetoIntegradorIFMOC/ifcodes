<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class ForgotPasswordTempController extends Controller
{
    /**
     * Handle a password reset link request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendTempPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // We will send the password reset link to this user. Once we have attempted
        // to send the link, we will examine the response then see the message we
        // need to show to the user. Finally, we'll send out a proper response.
        $status = Password::sendResetLink(
            $request->only('email')
        );

        // Always return a success message to prevent email enumeration
        return response()->json(['message' => 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'], 200);
    }
}