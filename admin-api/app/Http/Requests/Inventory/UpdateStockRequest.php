<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStockRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'operation' => 'required|string|in:add,subtract,set',
            'quantity'  => 'required|integer|min:0',
            'reason'    => 'required|string|max:255',
            'notes'     => 'nullable|string|max:1000',
        ];
    }
}