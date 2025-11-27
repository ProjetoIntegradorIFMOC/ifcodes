<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\SendTempPassword;

class ForgotPasswordTempController extends Controller
{
    /**
     * Handle a temporary password request.
     *
     * Validates the provided email address and, if a matching user exists,
     * generates a temporary password, updates the user's credentials, and
     * sends the new temporary password via email.
     *
     * To prevent account enumeration, this method always returns the same
     * success response, regardless of whether the email exists.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendTempPassword(Request $request)
    {
        // Validate that a valid email address has been provided
        $request->validate(['email' => 'required|email']);

        // Attempt to find the user by the provided email
        $user = User::where('email', $request->email)->first();

        // If no user is found, return a generic response (security measure)
        if (!$user) {
            return response()->json(['message' => 'E-mail enviado, se estiver correto.'], 200);
        }

        // Generate a random temporary password
        $tempPassword = Str::random(10);

        // Update the user's password and mark that they must change it at next login
        $user->update([
            'password' => $tempPassword,

            'must_change_password' => true
        ]);

        // Send an email with the temporary password to the user
        Mail::to($user->email)->send(new SendTempPassword($tempPassword));

        // Return a generic response to avoid revealing whether the email exists
        return response()->json(['message' => 'E-mail enviado, se estiver correto.'], 200);
    }
}