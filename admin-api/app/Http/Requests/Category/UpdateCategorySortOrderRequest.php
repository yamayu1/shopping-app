<?php

namespace App\Http\Requests\Category;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCategorySortOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'categories'              => 'required|array|min:1',
            'categories.*.id'         => 'required|exists:categories,id',
            'categories.*.sort_order' => 'required|integer|min:0',
        ];
    }
}