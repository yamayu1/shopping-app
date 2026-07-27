<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateStockRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'updates'              => 'required|array|min:1',
            'updates.*.product_id' => 'required|exists:products,id',
            'updates.*.operation'  => 'required|string|in:add,subtract,set',
            'updates.*.quantity'   => 'required|integer|min:0',
            'reason'               => 'required|string|max:255',
            'notes'                => 'nullable|string|max:1000',
        ];
    }
}