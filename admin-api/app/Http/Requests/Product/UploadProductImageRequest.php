<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UploadProductImageRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'image' => 'required|file|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ];
    }
}