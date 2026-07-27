<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'                => 'required|string|max:255',
            'description'         => 'nullable|string',
            'short_description'   => 'nullable|string|max:500',
            'sku'                 => 'required|string|max:100|unique:products,sku',
            'price'               => 'required|numeric|min:0',
            'sale_price'          => 'nullable|numeric|min:0|lt:price',
            'cost_price'          => 'nullable|numeric|min:0',
            'stock_quantity'      => 'required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'category_id'         => 'required|exists:categories,id',
            'brand'               => 'nullable|string|max:255',
            'color'               => 'nullable|string|max:100',
            'size'                => 'nullable|string|max:100',
            'material'            => 'nullable|string|max:255',
            'is_active'           => 'boolean',
            'is_featured'         => 'boolean',
            'meta_title'          => 'nullable|string|max:255',
            'meta_description'    => 'nullable|string|max:500',
            'tags'                => 'nullable|array',
            'images'              => 'nullable|array|max:10',
            'images.*'            => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'custom_attributes'   => 'nullable|json',
        ];
    }
}