<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name'                => 'sometimes|required|string|max:255',
            'description'         => 'nullable|string',
            'short_description'   => 'nullable|string|max:500',
            'sku'                 => 'sometimes|required|string|max:100|unique:products,sku,' . $id,
            'price'               => 'sometimes|required|numeric|min:0',
            'sale_price'          => 'nullable|numeric|min:0|lt:price',
            'cost_price'          => 'nullable|numeric|min:0',
            'stock_quantity'      => 'sometimes|required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'category_id'         => 'sometimes|required|exists:categories,id',
            'brand'               => 'nullable|string|max:255',
            'color'               => 'nullable|string|max:100',
            'size'                => 'nullable|string|max:100',
            'material'            => 'nullable|string|max:255',
            'is_active'           => 'boolean',
            'is_featured'         => 'boolean',
            'meta_title'          => 'nullable|string|max:255',
            'meta_description'    => 'nullable|string|max:500',
            'tags'                => 'nullable|array',
            'new_images'          => 'nullable|array|max:10',
            'new_images.*'        => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'remove_images'       => 'nullable|array',
            'custom_attributes'   => 'nullable|json',
        ];
    }
}