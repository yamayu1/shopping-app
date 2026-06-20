<?php

namespace App\Http\Requests\Order;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'status' => 'required|string|in:' . implode(',', [
                Order::STATUS_PENDING,
                Order::STATUS_CONFIRMED,
                Order::STATUS_PROCESSING,
                Order::STATUS_SHIPPED,
                Order::STATUS_DELIVERED,
                Order::STATUS_CANCELLED,
                Order::STATUS_REFUNDED,
            ]),
            'notes'           => 'nullable|string|max:1000',
            'tracking_number' => 'nullable|string|max:255',
        ];
    }
}