<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateProductStockRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'products'                  => 'required|array|min:1',
            'products.*.id'             => 'required|exists:products,id',
            'products.*.stock_quantity' => 'required|integer|min:0',
            'reason'                    => 'nullable|string|max:255',
        ];
    }
}