<?php

namespace App\Http\Requests\Category;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'              => 'required|string|max:255',
            'slug'              => 'nullable|string|max:255|unique:categories,slug',
            'description'       => 'nullable|string',
            'image'             => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'icon'              => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:1024',
            'sort_order'        => 'nullable|integer|min:0',
            'is_active'         => 'boolean',
            'is_featured'       => 'boolean',
            'meta_title'        => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'custom_attributes' => 'nullable|json',
        ];
    }
}