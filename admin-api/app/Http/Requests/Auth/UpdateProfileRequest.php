<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $adminId = auth('admin')->id();

        return [
            'name'  => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:admins,email,' . $adminId,
        ];
    }
}